/** Resolves a ToolGlows semantic design token in the current document. */
export function resolveDesignToken(token: string): string {
  const root = document.getElementById('toolglows-root') ?? document.documentElement
  return getComputedStyle(root).getPropertyValue(token).trim()
}

/** Resolves nested color variables before applying them to the host page. */
export function resolveDesignColorToken(token: string): string {
  const root = document.getElementById('toolglows-root') ?? document.documentElement
  const probe = document.createElement('span')
  probe.style.display = 'none'
  probe.style.color = `var(${token})`
  root.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

export function elementOutline(style: 'solid' | 'dashed'): string {
  return `${resolveDesignToken('--tg-element-outline-width')} ${style} ${resolveDesignColorToken('--tg-element-outline')}`
}
