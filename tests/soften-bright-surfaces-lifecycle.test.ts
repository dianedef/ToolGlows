/* @vitest-environment jsdom */
import { afterEach, expect, it, vi } from 'vitest'
import { startSofteningBrightSurfaces, stopSofteningBrightSurfaces } from '../src/content-script/softenBrightSurfaces'

afterEach(() => {
  stopSofteningBrightSurfaces()
  vi.useRealTimers()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})

it('keeps a white container dark through rescans, then restores its original stylesheet', async () => {
  vi.useFakeTimers()
  document.head.innerHTML = '<style>.preorder-container {background-color: rgb(255,255,255)} [data-toolglows-soft-light="surface"] {background-color: rgb(27,31,36) !important}</style>'
  document.body.innerHTML = '<div class="preorder-container">Public update</div>'
  const element = document.querySelector('.preorder-container')!
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 255, 255)')
  startSofteningBrightSurfaces()
  await vi.advanceTimersByTimeAsync(20)
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(27, 31, 36)')
  await vi.advanceTimersByTimeAsync(3000)
  expect(element.getAttribute('data-toolglows-soft-light')).toBe('surface')
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(27, 31, 36)')
  stopSofteningBrightSurfaces()
  expect(element.hasAttribute('data-toolglows-soft-light')).toBe(false)
  expect(getComputedStyle(element).backgroundColor).toBe('rgb(255, 255, 255)')
})
