/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HIDE_ELEMENT_BOOTSTRAP_CACHE_KEY,
  HIDE_ELEMENT_BOOTSTRAP_CLASS,
  HIDE_ELEMENT_BOOTSTRAP_STYLE_ID,
  installHideElementBootstrap,
  retireHideElementBootstrap
} from '../src/content-script/hideElementBootstrap'

const localGet = vi.fn()
const localSet = vi.fn().mockResolvedValue(undefined)
const syncGet = vi.fn()

describe('hide element pre-render bootstrap', () => {
  beforeEach(() => {
    retireHideElementBootstrap()
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    localGet.mockReset()
    localSet.mockClear()
    syncGet.mockReset()
    vi.stubGlobal('chrome', {
      storage: {
        local: { get: localGet, set: localSet },
        sync: { get: syncGet }
      }
    })
  })

  it('hides cached targets before the main toolbar store starts', async () => {
    document.body.innerHTML = '<main id="saved">Saved content</main>'
    localGet.mockResolvedValue({
      [HIDE_ELEMENT_BOOTSTRAP_CACHE_KEY]: {
        hiddenElements: [{ selector: '#saved', domain: window.location.hostname }]
      }
    })

    await installHideElementBootstrap()

    expect(document.querySelector('#saved')?.classList.contains(HIDE_ELEMENT_BOOTSTRAP_CLASS)).toBe(true)
    expect(document.getElementById(HIDE_ELEMENT_BOOTSTRAP_STYLE_ID)?.textContent).toContain('display: none !important')
  })

  it('masks matching elements added during page parsing and retires cleanly', async () => {
    localGet.mockResolvedValue({
      [HIDE_ELEMENT_BOOTSTRAP_CACHE_KEY]: {
        hiddenElements: [{ selector: '.late-content', domain: window.location.hostname }]
      }
    })
    await installHideElementBootstrap()

    const lateElement = document.createElement('section')
    lateElement.className = 'late-content'
    document.body.append(lateElement)
    await Promise.resolve()

    expect(lateElement.classList.contains(HIDE_ELEMENT_BOOTSTRAP_CLASS)).toBe(true)

    retireHideElementBootstrap()
    expect(lateElement.classList.contains(HIDE_ELEMENT_BOOTSTRAP_CLASS)).toBe(false)
    expect(document.getElementById(HIDE_ELEMENT_BOOTSTRAP_STYLE_ID)).toBeNull()
  })
})
