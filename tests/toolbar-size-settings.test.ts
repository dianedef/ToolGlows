import { describe, expect, it } from 'vitest'
import { normalizeToolbarSize } from '@/utils/toolbarSize'

describe('toolbar size settings', () => {
  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
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
