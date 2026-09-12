import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const extensionPath = resolve('dist/chrome')
const profilePath = await mkdtemp(join(tmpdir(), 'toolglows-service-worker-'))
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

  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest())

  if (manifest.name !== 'ToolGlows') {
    throw new Error(`Unexpected service worker manifest: ${manifest.name}`)
  }

  console.log(JSON.stringify({
    ok: true,
    workerUrl: worker.url(),
    manifestName: manifest.name,
  }))
} finally {
  await context?.close()
  await rm(profilePath, { recursive: true, force: true })
}
