// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useElementSelector } from '../src/composables/useElementSelector'

describe('useElementSelector', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('lets excluded ToolGlows controls receive clicks while selection is active', () => {
    const control = document.createElement('button')
    control.dataset.toolglowsHiddenRestore = '.hidden-target'
    const onControlClick = vi.fn()
    control.addEventListener('click', onControlClick)
    document.body.append(control)

    const onElementSelect = vi.fn()
    const selector = useElementSelector({ onElementSelect })
    selector.startSelecting()

    control.click()

    expect(onControlClick).toHaveBeenCalledOnce()
    expect(onElementSelect).not.toHaveBeenCalled()
    selector.stopSelecting()
  })

  it('still captures ordinary page clicks for element selection', () => {
    const pageElement = document.createElement('article')
    const onPageClick = vi.fn()
    pageElement.addEventListener('click', onPageClick)
    document.body.append(pageElement)

    const onElementSelect = vi.fn()
    const selector = useElementSelector({ onElementSelect })
    selector.startSelecting()

    pageElement.click()

    expect(onElementSelect).toHaveBeenCalledWith(pageElement)
    expect(onPageClick).not.toHaveBeenCalled()
    selector.stopSelecting()
  })
})
