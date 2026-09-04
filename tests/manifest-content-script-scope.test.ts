import { describe, expect, it } from 'vitest'
import manifest from '../manifest.config'
import chromeManifestConfig from '../manifest.chrome.config'
import firefoxManifestConfig from '../manifest.firefox.config'

async function resolveManifest(config: unknown) {
  if (typeof config === 'function') {
    return config({ command: 'build', mode: 'production' })
  }
  return config
}

describe('content script frame scope', () => {
  it('mounts the toolbar only in the top-level document', () => {
    const toolbarScript = manifest.content_scripts?.find(script =>
      script.js?.includes('src/content-script/index.ts')
    )

    expect(toolbarScript).toBeDefined()
    expect(toolbarScript?.all_frames).toBe(false)
  })

  it('keeps the lightweight dark-mode bootstrap available to all frames', () => {
    const bootstrapScript = manifest.content_scripts?.find(script =>
      script.js?.includes('src/content-script/darkModeBootstrapEntry.ts')
    )

    expect(bootstrapScript).toBeDefined()
    expect(bootstrapScript?.all_frames).toBe(true)
  })

  it('runs the lightweight auto-copy listener in subframes without mounting another toolbar', () => {
    const frameScript = manifest.content_scripts?.find(script =>
      script.js?.includes('src/content-script/autoCopyFrameEntry.ts')
    )

    expect(frameScript).toBeDefined()
    expect(frameScript?.all_frames).toBe(true)
    expect(frameScript?.match_about_blank).toBe(true)
  })
})

describe('browser support floors', () => {
  it('requires a Chrome version that supports the declared side panel', async () => {
    const chromeManifest = await resolveManifest(chromeManifestConfig) as Record<string, unknown>
    expect(chromeManifest.minimum_chrome_version).toBe('114')
  })

  it('requires a Firefox version that supports data collection permissions', async () => {
    const firefoxManifest = await resolveManifest(firefoxManifestConfig) as {
      browser_specific_settings?: { gecko?: { strict_min_version?: string } }
    }
    expect(firefoxManifest.browser_specific_settings?.gecko?.strict_min_version).toBe('142.0')
  })
})
