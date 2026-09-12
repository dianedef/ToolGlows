import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  assertInternalBridgeSender,
  normalizeActiveToolIds,
  normalizeSettingsPayload,
} from '../src/background/messageSecurity'

describe('background message security boundary', () => {
  it('rejects page-window and malformed senders', () => {
    expect(() => assertInternalBridgeSender({ context: 'window', tabId: 1 })).toThrow(
      'Untrusted bridge sender',
    )
    expect(() => assertInternalBridgeSender(null)).toThrow('Untrusted bridge sender')
  })

  it('accepts maintained extension contexts', () => {
    for (const context of ['content-script', 'popup', 'options', 'devtools', 'background']) {
      expect(() => assertInternalBridgeSender({ context, tabId: 1 })).not.toThrow()
    }
  })

  it('normalizes bounded settings and drops unknown data', () => {
    expect(
      normalizeSettingsPayload({
        expanded: true,
        position: { x: 10, y: 20 },
        activeTools: ['readerMode', 'readerMode'],
        isPinned: false,
        interfaceTheme: 'dark',
        toolbarColor: '#ff69b4',
        toolbarSize: 'md',
        injected: 'must-not-survive',
      }),
    ).toEqual({
      expanded: true,
      position: { x: 10, y: 20 },
      activeTools: ['readerMode'],
      isPinned: false,
      interfaceTheme: 'dark',
      toolbarColor: '#ff69b4',
      toolbarSize: 'md',
    })
  })

  it('rejects oversized and malformed settings', () => {
    expect(normalizeSettingsPayload({})).toBeNull()
    expect(
      normalizeSettingsPayload({
        expanded: true,
        position: { x: Number.POSITIVE_INFINITY, y: 20 },
        activeTools: [],
        isPinned: false,
        interfaceTheme: 'dark',
        toolbarSize: 'md',
      }),
    ).toBeNull()
    expect(normalizeActiveToolIds(Array.from({ length: 101 }, (_, index) => `tool-${index}`))).toBeNull()
  })

  it('keeps the page window gateway closed in the shipped bridge', () => {
    const bridgeSource = readFileSync(new URL('../src/bridge/index.ts', import.meta.url), 'utf8')
    expect(bridgeSource).not.toContain('allowWindowMessaging')
  })

  it('guards every background bridge handler', () => {
    const backgroundSource = readFileSync(new URL('../src/background/index.ts', import.meta.url), 'utf8')
    const handlers = backgroundSource.matchAll(/onMessage\('([^']+)'[\s\S]*?=>\s*\{/g)

    for (const [, messageId] of handlers) {
      const start = backgroundSource.indexOf(`onMessage('${messageId}'`)
      const next = backgroundSource.indexOf("onMessage('", start + 1)
      const body = backgroundSource.slice(start, next === -1 ? undefined : next)
      expect(body, `${messageId} must reject non-extension senders`).toContain(
        'assertInternalBridgeSender(sender)',
      )
    }
  })
})
