import { describe, expect, it } from 'vitest'
import { normalizeToolbarSize } from '@/utils/toolbarSize'

describe('toolbar size settings', () => {
  it.each(['xxs', 'xxs-plus', 'xs', 'xs-plus', 'xs-plus-mid', 'sm', 'sm-plus', 'sm-plus-mid', 'md', 'md-mid', 'md-plus', 'md-plus-mid', 'lg', 'lg-mid', 'lg-plus', 'lg-plus-mid', 'xl', 'xl-mid', 'xxl'] as const)(
    'accepts the supported %s size',
    size => {
      expect(normalizeToolbarSize(size)).toBe(size)
    },
  )

  it.each([undefined, null, '', 'huge', 64])(
    'falls back to md for an invalid stored value (%s)',
    value => {
      expect(normalizeToolbarSize(value)).toBe('md')
    },
  )
})
