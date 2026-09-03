import { describe, expect, it } from 'vitest'
import manifest from '../manifest.config'

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
