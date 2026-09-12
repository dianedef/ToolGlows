import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const extensionPath = resolve('dist/chrome')
const profilePath = await mkdtemp(join(tmpdir(), 'toolglows-reload-smoke-'))
const diagnostics = []
let context

try {
  context = await chromium.launchPersistentContext(profilePath, {
    executablePath: chromium.executablePath(),
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  })
  await (context.serviceWorkers()[0] ? Promise.resolve() : context.waitForEvent('serviceworker'))
  const page = context.pages()[0] ?? await context.newPage()
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text())
  })
  page.on('pageerror', error => diagnostics.push(error.message))
  await page.route('https://example.com/**', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body><h1>ToolGlows reload fixture</h1><a href="https://example.com/a">A</a></body></html>',
  }))

  await page.goto('https://example.com/reload-smoke')
  for (let index = 0; index < 3; index += 1) {
    await page.locator('#toolglows-root').waitFor()
    await page.reload()
  }
  await page.locator('#toolglows-root').waitFor()
  await page.goto('https://example.com/github-like/repository')
  await page.locator('#toolglows-root').waitFor()
  await page.goBack()
  await page.locator('#toolglows-root').waitFor()
  await page.goForward()
  await page.locator('#toolglows-root').waitFor()
  await page.locator('[data-toolglows-main]').click()
  await page.locator('[data-tool-id="autoCopy"]').click()
  await page.locator('[data-tool-id="linksExplorer"]').click()
  await page.waitForTimeout(300)

  const relevant = diagnostics.filter(message =>
    message.includes('unload is not allowed') ||
    message.includes('No PrimeVue Toast provided') ||
    message.includes('[object DOMException]') ||
    message.includes('Unhandled promise rejection')
  )
  if (relevant.length > 0) throw new Error(`Runtime regressions: ${JSON.stringify(relevant)}`)
  console.log(JSON.stringify({ ok: true, reloads: 3, historyNavigations: 2, relevantErrors: relevant }))
} finally {
  await context?.close()
  await rm(profilePath, { recursive: true, force: true })
}
