import { Readability } from '@mozilla/readability'

export type ReaderTheme = 'light' | 'sepia' | 'dark'
export type ReaderFontFamily = 'system-ui' | 'serif' | 'sans-serif'

export interface ReaderModeOptions {
  fontFamily: ReaderFontFamily
  fontSize: number
  lineHeight: number
  maxWidth: number
  theme: ReaderTheme
  showImages: boolean
  showLinks: boolean
}

export interface ReaderArticle {
  title: string
  byline: string
  dir: 'ltr' | 'rtl' | 'auto'
  lang: string
  content: DocumentFragment
}

export const defaultReaderModeOptions: ReaderModeOptions = {
  fontFamily: 'system-ui',
  fontSize: 18,
  lineHeight: 1.6,
  maxWidth: 800,
  theme: 'light',
  showImages: true,
  showLinks: false,
}

export const readerModeLimits = {
  fontSize: { minimum: 14, maximum: 28 },
  lineHeight: { minimum: 1.2, maximum: 2.2 },
  maxWidth: { minimum: 480, maximum: 1200 },
} as const

const allowedTags = new Set([
  'A', 'ABBR', 'ARTICLE', 'B', 'BLOCKQUOTE', 'BR', 'CAPTION', 'CODE', 'DD',
  'DIV', 'DL', 'DT', 'EM', 'FIGCAPTION', 'FIGURE', 'H1', 'H2', 'H3', 'H4',
  'H5', 'H6', 'HR', 'I', 'IMG', 'LI', 'OL', 'P', 'PRE', 'SECTION', 'SMALL',
  'SPAN', 'STRONG', 'SUB', 'SUP', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH',
  'THEAD', 'TR', 'UL',
])

const allowedAttributes = new Set(['alt', 'dir', 'height', 'lang', 'title', 'width'])
const droppedTags = new Set([
  'AUDIO', 'BUTTON', 'CANVAS', 'EMBED', 'FORM', 'IFRAME', 'INPUT', 'MATH',
  'NOSCRIPT', 'OBJECT', 'SCRIPT', 'SELECT', 'STYLE', 'SVG', 'TEMPLATE',
  'TEXTAREA', 'VIDEO',
])
const fontFamilies = new Set<ReaderFontFamily>(['system-ui', 'serif', 'sans-serif'])
const readerThemes = new Set<ReaderTheme>(['light', 'sepia', 'dark'])

const clampNumber = (value: unknown, fallback: number, minimum: number, maximum: number) => {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback
}

export function normalizeReaderModeOptions(value: unknown): ReaderModeOptions {
  const candidate = value && typeof value === 'object'
    ? value as Partial<ReaderModeOptions>
    : {}

  return {
    fontFamily: fontFamilies.has(candidate.fontFamily as ReaderFontFamily)
      ? candidate.fontFamily as ReaderFontFamily
      : defaultReaderModeOptions.fontFamily,
    fontSize: clampNumber(
      candidate.fontSize,
      defaultReaderModeOptions.fontSize,
      readerModeLimits.fontSize.minimum,
      readerModeLimits.fontSize.maximum,
    ),
    lineHeight: clampNumber(
      candidate.lineHeight,
      defaultReaderModeOptions.lineHeight,
      readerModeLimits.lineHeight.minimum,
      readerModeLimits.lineHeight.maximum,
    ),
    maxWidth: clampNumber(
      candidate.maxWidth,
      defaultReaderModeOptions.maxWidth,
      readerModeLimits.maxWidth.minimum,
      readerModeLimits.maxWidth.maximum,
    ),
    theme: readerThemes.has(candidate.theme as ReaderTheme)
      ? candidate.theme as ReaderTheme
      : defaultReaderModeOptions.theme,
    showImages: typeof candidate.showImages === 'boolean'
      ? candidate.showImages
      : defaultReaderModeOptions.showImages,
    showLinks: typeof candidate.showLinks === 'boolean'
      ? candidate.showLinks
      : defaultReaderModeOptions.showLinks,
  }
}

function safeUrl(value: string, kind: 'link' | 'image', baseUrl: string) {
  try {
    const url = new URL(value, baseUrl)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
    if (kind === 'link' && url.protocol === 'mailto:') return url.href
    if (
      kind === 'image' &&
      url.protocol === 'data:' &&
      /^data:image\/(?:avif|gif|jpeg|png|webp);base64,/i.test(value)
    ) return value
  } catch {
    // Invalid URLs are omitted at the trust boundary.
  }
  return null
}

function sanitizeNode(
  source: Node,
  ownerDocument: Document,
  baseUrl: string,
  options: ReaderModeOptions,
): Node | null {
  if (source.nodeType === Node.TEXT_NODE) {
    return ownerDocument.createTextNode(source.textContent ?? '')
  }
  if (!(source instanceof Element)) return null

  const tagName = source.tagName.toUpperCase()
  if (droppedTags.has(tagName)) return null
  if (!allowedTags.has(tagName)) {
    const fragment = ownerDocument.createDocumentFragment()
    source.childNodes.forEach((child) => {
      const sanitized = sanitizeNode(child, ownerDocument, baseUrl, options)
      if (sanitized) fragment.appendChild(sanitized)
    })
    return fragment
  }

  if (tagName === 'IMG' && !options.showImages) return null

  const element = ownerDocument.createElement(tagName.toLowerCase())
  source.getAttributeNames().forEach((attributeName) => {
    const normalizedName = attributeName.toLowerCase()
    if (!allowedAttributes.has(normalizedName)) return
    element.setAttribute(normalizedName, source.getAttribute(attributeName) ?? '')
  })

  if (tagName === 'A') {
    const href = source.getAttribute('href')
    const resolvedHref = href ? safeUrl(href, 'link', baseUrl) : null
    if (resolvedHref) {
      element.setAttribute('href', resolvedHref)
      element.setAttribute('rel', 'noreferrer noopener')
      if (options.showLinks) element.setAttribute('data-reader-url', resolvedHref)
    }
  }

  if (tagName === 'IMG') {
    const src = source.getAttribute('src') || source.getAttribute('data-src')
    const resolvedSrc = src ? safeUrl(src, 'image', baseUrl) : null
    if (!resolvedSrc) return null
    element.setAttribute('src', resolvedSrc)
    element.setAttribute('loading', 'lazy')
    element.setAttribute('decoding', 'async')
  }

  source.childNodes.forEach((child) => {
    const sanitized = sanitizeNode(child, ownerDocument, baseUrl, options)
    if (sanitized) element.appendChild(sanitized)
  })
  return element
}

export function sanitizeReaderContent(
  html: string,
  ownerDocument: Document,
  baseUrl: string,
  options: ReaderModeOptions,
) {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const fragment = ownerDocument.createDocumentFragment()
  parsed.body.childNodes.forEach((child) => {
    const sanitized = sanitizeNode(child, ownerDocument, baseUrl, options)
    if (sanitized) fragment.appendChild(sanitized)
  })
  return fragment
}

function normalizeDirection(value: string | null | undefined): ReaderArticle['dir'] {
  return value === 'ltr' || value === 'rtl' ? value : 'auto'
}

export async function extractReaderArticle(
  sourceDocument: Document = document,
  options: ReaderModeOptions = defaultReaderModeOptions,
): Promise<ReaderArticle | null> {
  const clone = sourceDocument.cloneNode(true) as Document
  clone.querySelectorAll('#toolglows-root, [data-toolglows-reader]').forEach((node) => node.remove())

  const parsed = new Readability(clone).parse()
  if (!parsed?.content?.trim()) return null

  const content = sanitizeReaderContent(
    parsed.content,
    sourceDocument,
    sourceDocument.location?.href ?? window.location.href,
    options,
  )
  const readableText = content.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  if (readableText.length < 140) return null

  return {
    title: parsed.title?.trim() || sourceDocument.title || 'Lecture',
    byline: parsed.byline?.trim() || '',
    dir: normalizeDirection(parsed.dir || sourceDocument.dir),
    lang: parsed.lang?.trim() || sourceDocument.documentElement.lang || '',
    content,
  }
}

export function useReaderMode() {
  return { extractReaderArticle, normalizeReaderModeOptions }
}
