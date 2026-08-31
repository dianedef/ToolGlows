export function toPickerHex(value: string | undefined, fallback = '000000'): string {
  const normalized = value?.trim().replace(/^#/, '') ?? ''
  return /^[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : fallback
}

export function fromPickerHex(value: string | undefined, fallback = '#000000'): string {
  const normalized = toPickerHex(value, '')
  return normalized ? `#${normalized}` : fallback
}
