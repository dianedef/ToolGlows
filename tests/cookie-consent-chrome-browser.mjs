import { mkdtemp, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'toolglows-cookie-proof-'))
const extension = resolve('dist/chrome')
const output = resolve('.playwright-mcp/cookie-consent')
await mkdir(output, { recursive: true })
const context = await chromium.launchPersistentContext(profile, {
  executablePath: chromium.executablePath(), headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
})
try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
  const key = 'toolglowsCookieConsent'
  const set = value => worker.evaluate(async ({key,value}) => chrome.storage.local.set({[key]:value}), {key,value})
  const page = await context.newPage()
  await page.route('https://example.com/**', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body>
    <h1>Cookie consent test</h1><button id="unrelated" onclick="document.body.dataset.unrelated='clicked'">Accept all</button>
    <div id="onetrust-banner-sdk"><p>Cookies</p><button id="onetrust-accept-btn-handler" onclick="document.body.dataset.accepted='yes';this.parentElement.remove()">Accept all cookies</button></div>
    </body></html>` }))
  await page.goto('https://example.com/cookie-proof')
  await page.locator('#toolglows-root').waitFor()
  await page.waitForTimeout(700)
  assert.equal(await page.locator('#onetrust-banner-sdk').count(), 1, 'off by default')
  await page.getByRole('button', { name: 'ToolGlows', exact: true }).click()
  await page.locator('[data-toolglows-settings]').click()
  await page.locator('#pinBar').check()
  await page.getByRole('dialog').locator('[data-pc-section="closebutton"]').click()
  await page.locator('[data-tool-id="cookieConsent"]').click({ button: 'right' })
  const dialog = page.getByRole('dialog', { name: 'Acceptation des cookies' })
  await dialog.waitFor()
  await page.screenshot({ path: join(output, 'settings-before.png'), fullPage: true })
  await page.locator('#cookie-consent-enabled').check()
  await page.waitForFunction(() => document.body.dataset.accepted === 'yes')
  assert.equal(await page.locator('#unrelated').evaluate(el => el.ownerDocument.body.dataset.unrelated), undefined)
  await page.locator('#cookie-consent-excluded').check()
  await page.waitForFunction(() => document.querySelector('#cookie-consent-excluded')?.checked === true)
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(output, 'settings-excluded.png'), fullPage: true })
  const padding = await dialog.locator('.toolglows-settings-stack').evaluate(el => parseFloat(getComputedStyle(el).paddingLeft))
  assert.ok(padding >= 12, 'panel content has a visible gutter')
  await page.setViewportSize({width: 390, height: 844})
  await page.screenshot({path: join(output, 'settings-narrow.png'), fullPage: true})
  assert.ok((await dialog.boundingBox()).width <= 390, 'panel fits a narrow viewport')
  await page.setViewportSize({width: 1280, height: 720})
  await page.reload()
  await page.locator('#toolglows-root').waitFor()
  await page.waitForTimeout(700)
  assert.equal(await page.locator('#onetrust-banner-sdk').count(), 1, 'exception survives reload')
  await set({ enabled: true, excludedHosts: [] })
  await page.waitForFunction(() => document.body.dataset.accepted === 'yes')
  console.log('PASS: actual extension opt-in UI, default off, persistence, site exclusion, live settings, unrelated control untouched')

  for (const url of process.argv.includes('--fixture-only') ? [] : ['https://www.onetrust.com/', 'https://www.cookiebot.com/en/']) {
    await set({enabled: false, excludedHosts: []})
    const real = await context.newPage()
    try {
      await real.goto(url, {waitUntil: 'domcontentloaded', timeout: 30000})
      await real.waitForTimeout(5000)
      const selector = '#onetrust-accept-btn-handler, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll, #CybotCookiebotDialogBodyButtonAccept'
      const button = real.locator(selector).filter({visible: true}).first()
      const found = await button.count()
      if (!found) { console.log(JSON.stringify({url, result: 'No supported visible banner; no acceptance proof'})); continue }
      const title = await button.innerText()
      const started = Date.now()
      await set({enabled: true, excludedHosts: []})
      await button.waitFor({state: 'hidden', timeout: 10000})
      console.log(JSON.stringify({url, result: 'Recognized banner disappeared after opt-in', button: title, elapsedMs: Date.now()-started}))
      await real.screenshot({path: join(output, new URL(url).hostname + '.png')})
    } catch (error) { console.log(JSON.stringify({url, result: 'Incomplete site proof', error: error.message})) }
    finally { await real.close() }
  }
} finally { await context.close() }
