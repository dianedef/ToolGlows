import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync('src/content-script/index.ts', 'utf8')

describe('content-script runtime contract', () => {
  it('lets navigation destroy the isolated world instead of unmounting Vue during teardown', () => {
    expect(source).not.toContain('window.addEventListener("unload"')
    expect(source).not.toContain('window.addEventListener("pagehide"')
  })

  it('provides PrimeVue ToastService before mounting controls that call useToast', () => {
    expect(source).toContain("import ToastService from 'primevue/toastservice'")
    expect(source).toMatch(/app\.use\(PrimeVue,[\s\S]*?app\.use\(ToastService\)[\s\S]*?app\.mount/)
  })
})
