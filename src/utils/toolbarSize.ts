export const TOOLBAR_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

export type ToolbarSize = typeof TOOLBAR_SIZES[number]

export const normalizeToolbarSize = (value: unknown): ToolbarSize =>
  TOOLBAR_SIZES.includes(value as ToolbarSize) ? value as ToolbarSize : 'md'
