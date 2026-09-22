const modifierAliases: Record<string, string> = {
  control: 'Ctrl',
  ctrl: 'Ctrl',
  shift: 'Shift',
  meta: 'Meta',
  cmd: 'Meta',
  alt: 'Alt'
}

const modifierKeys = new Set(['Ctrl', 'Shift', 'Meta', 'Alt'])
const reservedKeys = new Set(['Escape', 'Tab', 'Alt'])

export function normalizeShortcutKey(key: string): string {
  const alias = modifierAliases[key.toLowerCase()]
  if (alias) return alias
  if (key === ' ' || key === 'Spacebar') return 'Space'
  return key.length === 1 ? key.toUpperCase() : key
}

export function normalizeKeyboardShortcut(shortcut: unknown): string | null {
  if (typeof shortcut !== 'string') return null

  const parts = shortcut.split('+').map(part => normalizeShortcutKey(part.trim()))
  if (!parts.length || parts.some(part => !part)) return null
  if (new Set(parts).size !== parts.length) return null

  const key = parts[parts.length - 1]!
  const modifiers = parts.slice(0, -1)
  if (reservedKeys.has(key) || modifiers.some(modifier => modifier === 'Alt')) return null
  if (modifiers.some(modifier => !modifierKeys.has(modifier))) return null
  if (modifierKeys.has(key) && (modifiers.length > 0 || key === 'Alt')) return null

  return parts.join('+')
}

export function shortcutFromKeyEvent(event: KeyboardEvent): string | null {
  if (event.altKey) return null

  const key = normalizeShortcutKey(event.key)
  if (modifierKeys.has(key) || reservedKeys.has(key) || ['Dead', 'Process', 'Unidentified'].includes(key)) {
    return null
  }

  const modifiers = [
    event.ctrlKey ? 'Ctrl' : null,
    event.shiftKey ? 'Shift' : null,
    event.metaKey ? 'Meta' : null
  ].filter((modifier): modifier is string => modifier !== null)

  return normalizeKeyboardShortcut([...modifiers, key].join('+'))
}

export function standaloneModifierFromKeyUp(event: KeyboardEvent): string | null {
  const key = normalizeShortcutKey(event.key)
  if (!modifierKeys.has(key)) return null
  if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) return null
  return key
}

export function matchesKeyboardShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const normalized = normalizeKeyboardShortcut(shortcut)
  if (!normalized) return false

  const parts = normalized.split('+')
  const key = parts[parts.length - 1]!
  const modifiers = new Set(parts.slice(0, -1))
  if (normalizeShortcutKey(event.key) !== key) return false

  return event.ctrlKey === (modifiers.has('Ctrl') || key === 'Ctrl')
    && event.shiftKey === (modifiers.has('Shift') || key === 'Shift')
    && event.metaKey === (modifiers.has('Meta') || key === 'Meta')
    && event.altKey === (modifiers.has('Alt') || key === 'Alt')
}

export function shortcutIncludesKey(shortcut: string, releasedKey: string): boolean {
  const normalized = normalizeKeyboardShortcut(shortcut)
  if (!normalized) return false
  return normalized.split('+').includes(normalizeShortcutKey(releasedKey))
}
