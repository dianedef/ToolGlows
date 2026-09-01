// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  defaultReaderModeOptions,
  normalizeReaderModeOptions,
  readerModeLimits,
  sanitizeReaderContent,
} from '../src/composables/useReaderMode'
import { useReaderModeStore } from '../src/stores/readerMode'

const storage = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))

vi.stubGlobal('chrome', { storage: { sync: storage } })

function fragmentHost(fragment: DocumentFragment) {
  const host = document.createElement('div')
  host.appendChild(fragment)
  return host
}

describe('reader mode preferences', () => {
  it('normalizes unsupported and out-of-range stored values', () => {
    expect(normalizeReaderModeOptions({
      fontFamily: 'Comic Sans',
      fontSize: readerModeLimits.fontSize.maximum + defaultReaderModeOptions.fontSize,
      lineHeight: 0,
      maxWidth: '640',
      theme: 'neon',
      showImages: false,
      showLinks: true,
    })).toEqual({
      ...defaultReaderModeOptions,
      fontSize: readerModeLimits.fontSize.maximum,
      lineHeight: readerModeLimits.lineHeight.minimum,
      maxWidth: 640,
      showImages: false,
      showLinks: true,
    })
  })
})

describe('reader mode sanitizer', () => {
  it('keeps semantic article content while rejecting active content and unsafe URLs', () => {
    const fragment = sanitizeReaderContent(`
      <article onclick="steal()">
        <p>Hello <strong>reader</strong>.</p>
        <script>alert('no')</script>
        <iframe src="https://example.com"></iframe>
        <a href="javascript:alert(1)">unsafe</a>
        <a href="/safe">safe</a>
        <img src="data:image/svg+xml;base64,PHN2Zy8+" onerror="steal()">
        <img src="/image.png" alt="Cover">
      </article>
    `, document, 'https://example.com/article', {
      ...defaultReaderModeOptions,
      showLinks: true,
    })
    const host = fragmentHost(fragment)

    expect(host.textContent).toContain('Hello reader.')
    expect(host.textContent).not.toContain("alert('no')")
    expect(host.querySelector('script, iframe, svg')).toBeNull()
    expect(host.querySelector('article')?.hasAttribute('onclick')).toBe(false)
    expect(host.querySelector('a[href^="javascript:"]')).toBeNull()
    expect(host.querySelector('a[href="https://example.com/safe"]')?.getAttribute('data-reader-url'))
      .toBe('https://example.com/safe')
    expect(host.querySelectorAll('img')).toHaveLength(1)
    expect(host.querySelector('img')?.getAttribute('src')).toBe('https://example.com/image.png')
    expect(host.querySelector('img')?.getAttribute('loading')).toBe('lazy')
  })

  it('removes images when the persisted preference disables them', () => {
    const fragment = sanitizeReaderContent(
      '<p>Text</p><img src="https://example.com/image.png">',
      document,
      'https://example.com/',
      { ...defaultReaderModeOptions, showImages: false },
    )

    expect(fragmentHost(fragment).querySelector('img')).toBeNull()
  })
})

describe('reader mode lifecycle', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '<head><title>Article</title></head><body></body>'
    document.documentElement.style.overflow = ''
    document.body.innerHTML = `
      <div id="toolglows-root"><button data-toolglows-main>ToolGlows</button></div>
      <main>
        <article>
          <h1>A useful article</h1>
          ${'<p>This article contains enough useful words for a focused reading experience.</p>'.repeat(12)}
        </article>
      </main>
    `
    storage.get.mockReset().mockResolvedValue({})
    storage.set.mockReset().mockResolvedValue(undefined)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    setActivePinia(createPinia())
  })

  it('activates without replacing the host DOM and restores host accessibility state', async () => {
    const store = useReaderModeStore()
    const originalArticle = document.querySelector('article')

    await expect(store.activate()).resolves.toBe(true)
    expect(store.isActive).toBe(true)
    expect(document.querySelector('article')).toBe(originalArticle)
    expect(document.documentElement.style.overflow).toBe('hidden')

    store.deactivate()
    await new Promise(resolve => window.setTimeout(resolve, 0))
    expect(store.isActive).toBe(false)
    expect(document.querySelector('article')).toBe(originalArticle)
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.activeElement).toBe(document.querySelector('[data-toolglows-main]'))
  })

  it('leaves an unsupported page untouched and exposes a useful error', async () => {
    document.body.innerHTML = '<nav>Navigation only</nav>'
    const originalMarkup = document.body.innerHTML
    const store = useReaderModeStore()

    await expect(store.activate()).resolves.toBe(false)
    expect(store.isActive).toBe(false)
    expect(store.errorMessage).toContain('Aucun article')
    expect(document.body.innerHTML).toBe(originalMarkup)
  })

  it('persists normalized live settings', async () => {
    const store = useReaderModeStore()
    await store.loadOptions()
    await store.updateOptions({
      fontSize: readerModeLimits.fontSize.maximum + defaultReaderModeOptions.fontSize,
      theme: 'sepia',
    })

    expect(store.options.fontSize).toBe(readerModeLimits.fontSize.maximum)
    expect(store.options.theme).toBe('sepia')
    expect(storage.set).toHaveBeenCalledWith({
      readerModeOptions: expect.objectContaining({
        fontSize: readerModeLimits.fontSize.maximum,
        theme: 'sepia',
      }),
    })
  })
})
