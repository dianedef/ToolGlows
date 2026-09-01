export const TOOLBAR_SIZES = [
  'xxs',
  'xxs-plus',
  'xs',
  'xs-plus',
  'xs-plus-mid',
  'sm',
  'sm-plus',
  'sm-plus-mid',
  'md',
  'md-mid',
  'md-plus',
  'md-plus-mid',
  'lg',
  'lg-mid',
  'lg-plus',
  'lg-plus-mid',
  'xl',
  'xl-mid',
  'xxl'
] as const

export type ToolbarSize = typeof TOOLBAR_SIZES[number]

export const normalizeToolbarSize = (value: unknown): ToolbarSize =>
  TOOLBAR_SIZES.includes(value as ToolbarSize) ? value as ToolbarSize : 'md'
