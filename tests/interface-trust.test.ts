import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('interface trust contract', () => {
  it('exposes only implemented popup journeys', () => {
    const popup = read('src/ui/action-popup/pages/index.vue')

    expect(popup).toContain('to="/common/features"')
    expect(popup).toContain('to="/action-popup/playground"')
    expect(popup).not.toContain('/common/pricing')
    expect(popup).not.toContain('/common/account/login')
  })

  it('keeps extension shells reflowable and motion-aware', () => {
    const base = read('src/assets/base.scss')
    const toolbar = read('src/components/ToolGlowsBar.vue')
    const globalStyles = read('src/assets/main.css')

    expect(base).not.toContain('min-w-96')
    expect(base).toContain('overflow-x: hidden')
    expect(toolbar).toContain('var(--tg-viewport-inline-gutter)')
    expect(globalStyles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('loads the semantic design authority in popup and options surfaces', () => {
    expect(read('src/assets/design-tokens.css')).toMatch(/:root,\s*#app,\s*#toolglows-root/)
    expect(read('src/ui/action-popup/index.ts')).toContain('import "@/assets/main.css"')
    expect(read('src/ui/options-page/index.ts')).toContain('import "@/assets/main.css"')
  })
})
