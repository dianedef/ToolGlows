export const TEXT_CONTRAST_MINIMUM = 4.5
export const LINK_CONTRAST_MINIMUM = 3

function normalizeHex(value: string): string | null {
  const normalized = value.startsWith('#') ? value : `#${value}`
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : null
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
  const [red, green, blue] = channels.map(channel =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function getContrastRatio(foreground: string, background: string): number {
  const normalizedForeground = normalizeHex(foreground)
  const normalizedBackground = normalizeHex(background)
  if (!normalizedForeground || !normalizedBackground) return 1

  const lighter = Math.max(relativeLuminance(normalizedForeground), relativeLuminance(normalizedBackground))
  const darker = Math.min(relativeLuminance(normalizedForeground), relativeLuminance(normalizedBackground))
  return (lighter + 0.05) / (darker + 0.05)
}

function mixColor(from: string, to: string, amount: number): string {
  const channels = [1, 3, 5].map(index => {
    const start = Number.parseInt(from.slice(index, index + 2), 16)
    const end = Number.parseInt(to.slice(index, index + 2), 16)
    return Math.round(start + (end - start) * amount).toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

export function suggestReadableColor(
  preferred: string,
  background: string,
  minimumRatio: number
): string {
  const normalizedPreferred = normalizeHex(preferred)
  const normalizedBackground = normalizeHex(background)
  if (!normalizedPreferred || !normalizedBackground) return preferred
  if (getContrastRatio(normalizedPreferred, normalizedBackground) >= minimumRatio) return normalizedPreferred

  const whiteRatio = getContrastRatio('#ffffff', normalizedBackground)
  const blackRatio = getContrastRatio('#000000', normalizedBackground)
  const target = whiteRatio >= blackRatio ? '#ffffff' : '#000000'
  if (getContrastRatio(target, normalizedBackground) < minimumRatio) return target

  let low = 0
  let high = 1
  for (let iteration = 0; iteration < 16; iteration += 1) {
    const middle = (low + high) / 2
    if (getContrastRatio(mixColor(normalizedPreferred, target, middle), normalizedBackground) >= minimumRatio) {
      high = middle
    } else {
      low = middle
    }
  }
  return mixColor(normalizedPreferred, target, high)
}
