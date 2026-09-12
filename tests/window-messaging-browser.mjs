import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const extensionPath = resolve('dist/chrome')
const profilePath = await mkdtemp(join(tmpdir(), 'toolglows-window-boundary-'))
let context

try {
  context = await chromium.launchPersistentContext(profilePath, {
    executablePath: chromium.executablePath(),
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })

  await (context.serviceWorkers()[0] ? Promise.resolve() : context.waitForEvent('serviceworker'))
  const page = context.pages()[0] ?? await context.newPage()
  await page.route('https://example.com/**', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body><main>Hostile page fixture</main></body></html>',
  }))
  await page.goto('https://example.com')
  await page.locator('#toolglows-root').waitFor()

  const pageBridgeAccepted = await page.evaluate(async () => {
    const channel = new MessageChannel()
    const accepted = new Promise(resolve => {
      const timeout = window.setTimeout(() => resolve(false), 500)
      channel.port1.onmessage = event => {
        if (event.data === 'port-accepted') {
          window.clearTimeout(timeout)
          resolve(true)
        }
      }
    })

    window.postMessage(
      {
        cmd: 'webext-port-offer',
        scope: 'com.toolglows.extension',
        context: 'window',
      },
      '*',
      [channel.port2],
    )

    return accepted
  })

  if (pageBridgeAccepted) {
    throw new Error('The content script accepted a page-world bridge connection')
  }

  console.log(JSON.stringify({ ok: true, pageBridgeAccepted }))
} finally {
  await context?.close()
  await rm(profilePath, { recursive: true, force: true })
}
