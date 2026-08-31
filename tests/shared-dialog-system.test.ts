import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const componentsDirectory = path.join(root, 'src', 'components')

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

describe('shared ToolGlows dialog system', () => {
  it('routes every product dialog through the shared wrapper', () => {
    const componentFiles = fs.readdirSync(componentsDirectory)
      .filter(file => file.endsWith('.vue'))
      .map(file => ({ file, source: read(path.join('src', 'components', file)) }))

    const directPrimeVueConsumers = componentFiles
      .filter(({ source }) => source.includes("from 'primevue/dialog'"))
      .map(({ file }) => file)

    const sharedDialogUsages = componentFiles.reduce(
      (count, { source }) => count + (source.match(/<ToolGlowsDialog\b/g)?.length ?? 0),
      0
    )

    expect(directPrimeVueConsumers).toEqual(['ToolGlowsDialog.vue'])
    expect(sharedDialogUsages).toBe(28)
  })

  it('keeps automatic modal stacking above the toolbar', () => {
    const wrapper = read('src/components/ToolGlowsDialog.vue')
    const tokens = read('src/assets/design-tokens.css')
    const contentStyles = read('src/content-script/index.scss')
    const overlayBase = Number(tokens.match(/--tg-z-overlay:\s*(\d+)/)?.[1])
    const toolbarLayer = Number(tokens.match(/--tg-z-extension:\s*(\d+)/)?.[1])

    expect(wrapper).toContain(':auto-z-index="true"')
    expect(wrapper).toContain("resolveDesignToken('--tg-z-overlay')")
    expect(contentStyles).not.toMatch(/\.p-dialog(?:-mask)?[\s\S]*?z-index/)
    expect(contentStyles).toContain('z-index: var(--tg-z-extension) !important')
    expect(overlayBase).toBeLessThan(toolbarLayer)
    expect(overlayBase + 1100).toBeGreaterThan(toolbarLayer)
  })

  it('uses one floating-shell radius for the toolbar and dialogs', () => {
    const toolbar = read('src/components/ToolGlowsBar.vue')
    const sharedStyles = read('src/assets/main.css')

    expect(toolbar).toContain('border-radius: var(--tg-radius-floating-shell)')
    expect(sharedStyles).toContain('border-radius: var(--tg-radius-floating-shell)')
  })
})
