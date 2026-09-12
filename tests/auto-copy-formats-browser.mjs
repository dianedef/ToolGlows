import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright')

// Real extension and OS clipboard; only a disposable browser profile is used.
const browserName = process.argv[2] ?? 'chromium'
assert.ok(['chromium', 'firefox'].includes(browserName))
const extensionPath = resolve('dist', browserName === 'firefox' ? 'firefox' : 'chrome')
const profile = await mkdtemp(join(tmpdir(), 'toolglows-format-proof-'))
const fixtureUrl = 'https://example.com/toolglows-format-proof'
let context
let remote
const progress = step => console.log(`${browserName}: ${step}`)
const watchdog = setTimeout(() => {
  console.error(`${browserName}: overall browser proof timed out`)
  void context?.close()
}, 180000)

try {
  progress('launch')
  if (browserName === 'chromium') {
    context = await chromium.launchPersistentContext(profile, {
      executablePath: chromium.executablePath(), headless: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    })
  } else {
    const require = createRequire(import.meta.url)
    const modulePath = join(dirname(require.resolve('web-ext')), 'lib/firefox/remote.js')
    const { findFreeTcpPort, connectWithMaxRetries } = await import(pathToFileURL(modulePath).href)
    const port = await findFreeTcpPort()
    context = await firefox.launchPersistentContext(profile, {
      headless: true,
      executablePath: process.env.FIREFOX_EXECUTABLE || firefox.executablePath(),
      args: ['-start-debugger-server', String(port)],
      firefoxUserPrefs: {
        'devtools.debugger.remote-enabled': true,
        'devtools.debugger.prompt-connection': false,
        'xpinstall.signatures.required': false,
        'extensions.webextensions.uuids': JSON.stringify({
          'toolglows-v2@example.com': '819fef36-0f43-4f57-afad-33d53fd39819',
        }),
      },
    })
    remote = await connectWithMaxRetries({ port, maxRetries: 20, retryInterval: 100 })
    await remote.installTemporaryAddon(extensionPath)
    progress(`temporary extension tabs: ${context.pages().map(page => page.url()).join(', ')}`)
  }
  context.setDefaultTimeout(30000)
  let extensionOrigin
  if (browserName === 'chromium') {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
    extensionOrigin = `chrome-extension://${new URL(worker.url()).host}`
  } else {
    extensionOrigin = 'moz-extension://819fef36-0f43-4f57-afad-33d53fd39819'
  }
  const settings = context.pages()[0] ?? await context.newPage()
  const manifest = JSON.parse(await readFile(join(extensionPath, 'manifest.json'), 'utf8'))
  if (browserName === 'chromium') {
    await settings.goto(`${extensionOrigin}/${manifest.options_page}`, { waitUntil: 'commit' })
    await settings.waitForFunction(() => typeof chrome !== 'undefined' && !!chrome.storage?.sync)
    await settings.evaluate(async () => {
      await chrome.storage.sync.set({
        toolglowsSettings: { activeTools: ['autoCopy'] },
        autoCopySettings: {
          activeFormat: 'text', preserveFormatting: true,
          includeSource: true, showNotifications: true, enableAltSelection: true,
        },
      })
    })
  }
  progress('extension configured')
  const page = settings
  await page.route(fixtureUrl, route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><title>Format proof</title><p id="selection"><strong class="emphasis">A &amp; B</strong> <em data-note="test">italics</em></p><textarea id="paste" aria-label="Paste proof"></textarea>',
  }))
  await page.goto(fixtureUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('#toolglows-root').waitFor()
  await page.locator('[data-toolglows-main]').click()
  const toggle = page.locator('[data-tool-id="autoCopy"]')
  if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click()
  progress('content script loaded')
  const copyAndPaste = async shortcut => {
    await page.locator('#selection').evaluate(element => {
      element.tabIndex = -1
      element.focus()
      const range = document.createRange()
      range.selectNodeContents(element)
      const selection = getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    })
    await page.keyboard.press(shortcut)
    await page.locator('#paste').fill('')
    await page.locator('#paste').focus()
    await page.keyboard.press('Control+v')
    return page.locator('#paste').inputValue()
  }
  const html = await copyAndPaste('Alt+h')
  assert.ok(html.includes(`<a href="${fixtureUrl}">${fixtureUrl}</a>`), `HTML source mismatch: ${html}`)
  assert.ok(html.includes('<strong class="emphasis">A &amp; B</strong>'))
  progress('HTML clipboard passed')
  const markdown = await copyAndPaste('Alt+m')
  assert.ok(markdown.includes('**A & B** _italics_'), `Markdown mismatch: ${markdown}`)
  assert.ok(markdown.includes(`> Source: ${fixtureUrl}`))
  progress('Markdown clipboard passed')
  const text = await copyAndPaste('Alt+t')
  assert.equal(text, `A & B italics\n\nSource: ${fixtureUrl}`)
  progress('plain text shortcut passed')
  console.log(JSON.stringify({ ok: true, browser: browserName, version: context.browser()?.version(), checks: ['html-source', 'markdown-emphasis-and-entities', 'text-shortcut'], clipboard: 'real paste', profile: 'temporary' }))
} finally {
  clearTimeout(watchdog)
  remote?.disconnect()
  await context?.close()
  const target = resolve(profile)
  assert.ok(target.startsWith(`${resolve(tmpdir())}\\toolglows-format-proof-`))
  await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
