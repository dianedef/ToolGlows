import { describe, expect, it } from 'vitest'
import {
  extensionDetailsUrl,
  isSupportedPageUrl,
} from '../src/utils/contentScriptStatus'

describe('content script access status', () => {
  it('allows ordinary web pages only', () => {
    expect(isSupportedPageUrl('https://example.com/page')).toBe(true)
    expect(isSupportedPageUrl('http://localhost:3000')).toBe(true)
    expect(isSupportedPageUrl('edge://extensions')).toBe(false)
    expect(isSupportedPageUrl('chrome-extension://toolglows/options.html')).toBe(false)
    expect(isSupportedPageUrl(undefined)).toBe(false)
  })

  it('opens the matching browser extension details page', () => {
    expect(extensionDetailsUrl('Mozilla/5.0 Edg/140.0', 'abc')).toBe(
      'edge://extensions/?id=abc',
    )
    expect(extensionDetailsUrl('Mozilla/5.0 Chrome/140.0', 'abc')).toBe(
      'chrome://extensions/?id=abc',
    )
  })
})
