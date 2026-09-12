import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const extensionPath = resolve('dist/chrome')
const profilePath = await mkdtemp(join(tmpdir(), 'toolglows-performance-'))
let context

try {
  context = await chromium.launchPersistentContext(profilePath, {
    executablePath: chromium.executablePath(),
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  })

  await (context.serviceWorkers()[0] ? Promise.resolve() : context.waitForEvent('serviceworker'))
  const page = context.pages()[0] ?? await context.newPage()
  await page.addInitScript(() => {
    window.__toolglowsMetrics = { navigationStart: performance.now(), toolbarReady: null }
    new MutationObserver((_records, observer) => {
      if (document.getElementById('toolglows-root')) {
        window.__toolglowsMetrics.toolbarReady = performance.now()
        observer.disconnect()
      }
    }).observe(document, { childList: true, subtree: true })
  })
  await page.route('https://example.com/**', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body><main>Performance fixture</main></body></html>'
  }))

  await page.goto('https://example.com')
  await page.locator('#toolglows-root').waitFor()
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    const state = window.__toolglowsMetrics
    return {
      toolbarReadyMs: Math.round(state.toolbarReady - state.navigationStart),
      domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
      loadMs: Math.round(navigation.loadEventEnd)
    }
  })

  if (metrics.toolbarReadyMs > 5000) {
    throw new Error(`Toolbar readiness exceeded the 5000 ms local proof ceiling: ${metrics.toolbarReadyMs} ms`)
  }

  console.log(JSON.stringify({ ok: true, ...metrics }))
} finally {
  await context?.close()
  await rm(profilePath, { recursive: true, force: true })
}
