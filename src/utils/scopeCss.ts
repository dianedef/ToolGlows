import postcss from 'postcss'

const DEFAULT_TOOLGLOWS_SCOPE = [
  '#toolglows-root',
  '.toolglows-dialog',
  '.toolglows-dialog-mask',
  '[data-toolglows-ui]'
]

const TOOLGLOWS_PAGE_RUNTIME_SELECTORS = [
  '.toolglows-hidden-element-preview',
  '.toolglows-hidden-element-restore'
]

function scopeSelector(selector: string, scopes: string[]): string[] {
  const trimmed = selector.trim()
  if (!trimmed) return []

  // Keep selectors that already belong to a ToolGlows container. Prefixing
  // them again would produce impossible selectors such as
  // `#toolglows-root #toolglows-root *` and break the extension UI.
  if (scopes.some(scope => trimmed === scope || trimmed.startsWith(`${scope} `) || trimmed.startsWith(`${scope}:`))) {
    return [trimmed]
  }

  if (TOOLGLOWS_PAGE_RUNTIME_SELECTORS.some(selector =>
    trimmed === selector || trimmed.startsWith(`${selector}:`) || trimmed.startsWith(`${selector} `)
  )) {
    return [trimmed]
  }

  return scopes.map(scope => {
    if (trimmed === ':root' || trimmed === 'html' || trimmed === 'body') return scope
    if (trimmed.startsWith(':root ')) return `${scope}${trimmed.slice(5)}`
    if (trimmed.startsWith('html ')) return `${scope}${trimmed.slice(4)}`
    if (trimmed.startsWith('body ')) return `${scope}${trimmed.slice(4)}`
    return `${scope} ${trimmed}`
  })
}

/**
 * Prefixes third-party component CSS so generic PrimeVue class names on the
 * host page can never be selected by ToolGlows styles.
 */
export function scopeToolGlowsCss(css: string, scopes = DEFAULT_TOOLGLOWS_SCOPE): string {
  const root = postcss.parse(css)

  root.walkRules(rule => {
    if (rule.parent?.type === 'atrule' && /^(keyframes|-webkit-keyframes)$/i.test(rule.parent.name)) {
      return
    }

    rule.selectors = rule.selectors.flatMap(selector => scopeSelector(selector, scopes))
  })

  return root.toString()
}
