import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

describe('installed DarkReader CSP compatibility', () => {
  it.each([false, true])('keeps theme styles with proxies disabled=%s', (disabled) => {
    const dom = new JSDOM('<html><head></head><body>Readable text</body></html>', {
      url: 'https://example.test', runScripts: 'outside-only', pretendToBeVisual: true
    })
    const { window } = dom
    // These browser APIs are absent from jsdom, but consulted by DarkReader.
    window.SVGStyleElement = class extends window.SVGElement {}
    window.matchMedia = () => ({
      matches: false, addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {}
    })
    window.eval(readFileSync(require.resolve('darkreader'), 'utf8'))
    const insertBefore = window.Node.prototype.insertBefore
    const attemptedScripts: string[] = []
    window.Node.prototype.insertBefore = function (node, reference) {
      if (node instanceof window.HTMLScriptElement) attemptedScripts.push(node.textContent ?? '')
      return insertBefore.call(this, node, reference)
    }
    try {
      window.DarkReader.enable({}, {
        disableStyleSheetsProxy: disabled,
        disableCustomElementRegistryProxy: disabled
      })
      expect(window.DarkReader.isEnabled()).toBe(true)
      expect(window.document.querySelectorAll('style.darkreader').length).toBeGreaterThan(0)
      expect(attemptedScripts).toHaveLength(disabled ? 0 : 1)
      window.DarkReader.disable()
      expect(window.document.querySelectorAll('style.darkreader')).toHaveLength(0)
    } finally {
      window.close()
    }
  })
})
