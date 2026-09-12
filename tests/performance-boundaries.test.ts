import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const toolbarSource = readFileSync('src/components/ToolGlowsBar.vue', 'utf8')
const contentScriptSource = readFileSync('src/content-script/index.ts', 'utf8')

describe('content-script performance boundaries', () => {
  it('loads optional tool panels asynchronously', () => {
    const optionalPanels = [
      'InstagramSavedLibrary',
      'BetterGmailControl',
      'SocialAnalysisControl',
      'ReaderModeControl'
    ]

    for (const panel of optionalPanels) {
      expect(toolbarSource).toContain(`const ${panel} = lazyTool(() => import('./${panel}.vue'))`)
      expect(toolbarSource).not.toMatch(
        new RegExp(`import\\s+${panel}\\s+from\\s+['"]\\./${panel}\\.vue['"]`)
      )
    }
  })

  it('does not register the full PrimeVue catalog in the all-sites content script', () => {
    expect(contentScriptSource).not.toContain("from '../utils/setupPrimeVue'")
    expect(contentScriptSource).not.toContain('setupPrimeVue(app)')
  })
})
