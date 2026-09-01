import { describe, expect, it, vi } from 'vitest'
import {
  DARK_MODE_PREPAINT_ALARM,
  buildDarkModePrepaintExclusions,
  getNextDarkModeScheduleBoundary,
  resolveDarkModePrepaintMode,
  syncDarkModePrepaint,
  type DarkModePrepaintApi
} from '../src/background/darkModePrepaint'

describe('persistent dark-mode prepaint', () => {
  it('resolves manual, system and scheduled activation without a page context', () => {
    expect(resolveDarkModePrepaintMode({ isActive: true })).toBe('always')
    expect(resolveDarkModePrepaintMode({ isActive: false })).toBe('off')
    expect(resolveDarkModePrepaintMode({ options: { syncWithSystem: true } })).toBe('system')
    expect(resolveDarkModePrepaintMode({
      options: { autoEnable: true, scheduleStart: '20:00', scheduleEnd: '07:00' }
    }, new Date(2026, 7, 31, 23, 0))).toBe('always')
  })

  it('turns exact validated exclusions into content-script match patterns', () => {
    expect(buildDarkModePrepaintExclusions([
      'Docker.com', 'docker.com', '*.invalid.example', 'bad/path', '', null
    ])).toEqual(['*://docker.com/*'])
  })

  it('schedules the first activation boundary after now', () => {
    const boundary = getNextDarkModeScheduleBoundary({
      autoEnable: true,
      scheduleStart: '20:00',
      scheduleEnd: '07:00'
    }, new Date(2026, 7, 31, 23, 0))

    expect(boundary).toEqual(new Date(2026, 8, 1, 7, 1))
  })

  it('registers a persistent document-start stylesheet and the next schedule alarm', async () => {
    const api = {
      storage: {
        local: { get: vi.fn(async () => ({
          toolglowsDarkModeBootstrap: {
            isActive: false,
            options: {
              autoEnable: true,
              scheduleStart: '20:00',
              scheduleEnd: '07:00',
              excludedDomains: ['example.com']
            }
          }
        })) },
        sync: { get: vi.fn(async () => ({})) }
      },
      scripting: {
        getRegisteredContentScripts: vi.fn(async () => []),
        registerContentScripts: vi.fn(async () => undefined),
        updateContentScripts: vi.fn(async () => undefined),
        unregisterContentScripts: vi.fn(async () => undefined)
      },
      alarms: {
        clear: vi.fn(async () => true),
        create: vi.fn(async () => undefined)
      }
    } satisfies DarkModePrepaintApi

    await expect(syncDarkModePrepaint(api, new Date(2026, 7, 31, 23, 0))).resolves.toBe('always')
    expect(api.scripting.registerContentScripts).toHaveBeenCalledWith([expect.objectContaining({
      css: ['dark-mode-prepaint.css'],
      excludeMatches: ['*://example.com/*'],
      allFrames: true,
      runAt: 'document_start',
      persistAcrossSessions: true
    })])
    expect(api.alarms.create).toHaveBeenCalledWith(DARK_MODE_PREPAINT_ALARM, {
      when: new Date(2026, 8, 1, 7, 1).getTime()
    })
  })
})
