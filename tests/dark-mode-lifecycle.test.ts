/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const darkReader = vi.hoisted(() => ({
  disable: vi.fn(),
  enable: vi.fn(),
  isEnabled: vi.fn(() => true)
}))

vi.mock('darkreader', () => darkReader)
vi.mock('webext-bridge/content-script', () => ({ onMessage: vi.fn() }))

import { removeDarkMode } from '../src/content-script/darkMode'
import { maintainDarkModeBackdrop } from '../src/content-script/darkModeBootstrap'

describe('dark mode DOM lifecycle', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    darkReader.disable.mockClear()
    darkReader.isEnabled.mockReturnValue(true)
  })

  it('removes every page-level dark-mode artifact', () => {
    maintainDarkModeBackdrop({ backgroundColor: '#202124' })

    const overrides = document.createElement('style')
    overrides.id = 'toolglows-dark-mode-overrides'
    document.head.appendChild(overrides)

    const softenedField = document.createElement('input')
    softenedField.setAttribute('data-toolglows-soft-light', 'control')
    document.body.appendChild(softenedField)

    expect(removeDarkMode()).toBe(true)
    expect(darkReader.disable).toHaveBeenCalledOnce()
    expect(document.getElementById('toolglows-dark-mode-bootstrap')).toBeNull()
    expect(document.getElementById('toolglows-dark-mode-overrides')).toBeNull()
    expect(document.querySelector('[data-toolglows-soft-light]')).toBeNull()
  })
})
