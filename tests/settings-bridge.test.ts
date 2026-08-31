import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMessage } = vi.hoisted(() => ({
  sendMessage: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('webext-bridge/content-script', () => ({
  allowWindowMessaging: vi.fn(),
  onMessage: vi.fn(),
  sendMessage
}))

import { bridgeApi } from '@/bridge'

describe('settings bridge persistence', () => {
  beforeEach(() => sendMessage.mockClear())

  it('keeps hidden element records in the synchronized payload', async () => {
    await bridgeApi.updateSettings({
      expanded: true,
      position: { x: 10, y: 20 },
      activeTools: ['hideElement'],
      isPinned: false,
      interfaceTheme: 'dark',
      toolbarSize: 'md',
      hideElement: {
        hiddenElements: [{
          selector: '#content',
          domain: 'example.com',
          timestamp: 1,
          name: 'Content'
        }],
        isSelectingElement: true,
        shortcut: 'Alt+H',
        enableShortcut: true
      }
    })

    expect(sendMessage).toHaveBeenCalledWith(
      'SETTINGS_UPDATED',
      {
        settings: expect.objectContaining({
          interfaceTheme: 'dark',
          hideElement: {
            hiddenElements: [{
              selector: '#content',
              domain: 'example.com',
              timestamp: 1,
              name: 'Content'
            }],
            isSelectingElement: false,
            shortcut: 'Alt+H',
            enableShortcut: true
          }
        })
      },
      'background'
    )
  })
})
