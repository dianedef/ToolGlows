/** Resolves a ToolGlows semantic design token in the current document. */
export function resolveDesignToken(token: string): string {
  const root = document.getElementById('toolglows-root') ?? document.documentElement
  return getComputedStyle(root).getPropertyValue(token).trim()
}

export function elementOutline(style: 'solid' | 'dashed'): string {
  return `${resolveDesignToken('--tg-element-outline-width')} ${style} ${resolveDesignToken('--tg-element-outline')}`
}
