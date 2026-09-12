import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '../manifest.config'
import firefoxManifestConfig from '../manifest.firefox.config'

describe('manifest execution entry points', () => {
  it('uses distinct basenames so CRXJS cannot map the service worker to a content-script bundle', () => {
    const entries = [
      manifest.background?.service_worker,
      ...manifest.content_scripts.flatMap(script => script.js ?? [])
    ].filter((entry): entry is string => typeof entry === 'string')

    const basenames = entries.map(entry => basename(entry))
    expect(new Set(basenames).size).toBe(basenames.length)
  })

  it('keeps the Firefox background entry distinct too', async () => {
    const firefoxManifest = typeof firefoxManifestConfig === 'function'
      ? await firefoxManifestConfig({ command: 'build', mode: 'production' })
      : firefoxManifestConfig
    const backgroundEntries = firefoxManifest.background && 'scripts' in firefoxManifest.background
      ? firefoxManifest.background.scripts ?? []
      : []
    const contentEntries = firefoxManifest.content_scripts?.flatMap(script => script.js ?? []) ?? []
    const basenames = [...backgroundEntries, ...contentEntries].map(entry => basename(entry))

    expect(new Set(basenames).size).toBe(basenames.length)
  })
})
