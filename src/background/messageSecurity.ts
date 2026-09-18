import { isInternalEndpoint } from 'webext-bridge'
import { TOOLBAR_SIZES, type ToolbarSize } from '@/utils/toolbarSize'

const MAX_ACTIVE_TOOLS = 100
const MAX_TOOL_ID_LENGTH = 100
const MAX_HIDDEN_ELEMENTS = 1_000
const MAX_SELECTOR_LENGTH = 2_048
const MAX_DOMAIN_LENGTH = 253
const MAX_LABEL_LENGTH = 500
const MAX_SHORTCUT_LENGTH = 100

type UnknownRecord = Record<string, unknown>

export interface BackgroundSettings {
  expanded: boolean
  position: { x: number; y: number }
  activeTools: string[]
  isPinned: boolean
  toolbarVisible: boolean
  interfaceTheme?: 'light' | 'dark'
  toolbarColor?: string
  toolbarSize: ToolbarSize
  hideElement?: {
    hiddenElements: Array<{
      selector: string
      domain: string
      timestamp: number
      name?: string
    }>
    isSelectingElement: boolean
    shortcut: string
    enableShortcut: boolean
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function boundedString(value: unknown, maxLength: number, allowEmpty = false): value is string {
  return typeof value === 'string' &&
    value.length <= maxLength &&
    (allowEmpty || value.trim().length > 0)
}

export function assertInternalBridgeSender(sender: unknown): void {
  if (!isRecord(sender) || typeof sender.context !== 'string') {
    throw new Error('Untrusted bridge sender')
  }

  try {
    if (!isInternalEndpoint(sender as never)) throw new Error('Untrusted bridge sender')
  } catch {
    throw new Error('Untrusted bridge sender')
  }
}

export function normalizeActiveToolIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_ACTIVE_TOOLS) return null

  const normalized: string[] = []
  const seen = new Set<string>()
  for (const candidate of value) {
    if (!boundedString(candidate, MAX_TOOL_ID_LENGTH)) return null
    if (!seen.has(candidate)) {
      seen.add(candidate)
      normalized.push(candidate)
    }
  }
  return normalized
}

function normalizeHiddenElements(value: unknown): BackgroundSettings['hideElement'] | null {
  if (!isRecord(value) || !Array.isArray(value.hiddenElements)) return null
  if (value.hiddenElements.length > MAX_HIDDEN_ELEMENTS) return null
  if (
    typeof value.isSelectingElement !== 'boolean' ||
    !boundedString(value.shortcut, MAX_SHORTCUT_LENGTH, true) ||
    typeof value.enableShortcut !== 'boolean'
  ) return null

  const hiddenElements: NonNullable<BackgroundSettings['hideElement']>['hiddenElements'] = []
  for (const candidate of value.hiddenElements) {
    if (!isRecord(candidate)) return null
    if (
      !boundedString(candidate.selector, MAX_SELECTOR_LENGTH) ||
      !boundedString(candidate.domain, MAX_DOMAIN_LENGTH) ||
      typeof candidate.timestamp !== 'number' ||
      !Number.isFinite(candidate.timestamp) ||
      candidate.timestamp < 0 ||
      (candidate.name !== undefined && !boundedString(candidate.name, MAX_LABEL_LENGTH, true))
    ) return null

    hiddenElements.push({
      selector: candidate.selector,
      domain: candidate.domain,
      timestamp: candidate.timestamp,
      ...(candidate.name === undefined ? {} : { name: candidate.name }),
    })
  }

  return {
    hiddenElements,
    // Selection is a tab-local interaction and must never be synchronized.
    isSelectingElement: false,
    shortcut: value.shortcut,
    enableShortcut: value.enableShortcut,
  }
}

export function normalizeSettingsPayload(value: unknown): BackgroundSettings | null {
  if (!isRecord(value) || !isRecord(value.position)) return null

  const activeTools = normalizeActiveToolIds(value.activeTools)
  if (
    typeof value.expanded !== 'boolean' ||
    typeof value.position.x !== 'number' ||
    !Number.isFinite(value.position.x) ||
    typeof value.position.y !== 'number' ||
    !Number.isFinite(value.position.y) ||
    activeTools === null ||
    typeof value.isPinned !== 'boolean' ||
    (value.toolbarVisible !== undefined && typeof value.toolbarVisible !== 'boolean') ||
    (value.interfaceTheme !== undefined && value.interfaceTheme !== 'light' && value.interfaceTheme !== 'dark') ||
    (value.toolbarColor !== undefined &&
      (typeof value.toolbarColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.toolbarColor))) ||
    !TOOLBAR_SIZES.includes(String(value.toolbarSize) as ToolbarSize)
  ) return null

  const settings: BackgroundSettings = {
    expanded: value.expanded,
    position: { x: value.position.x, y: value.position.y },
    activeTools,
    isPinned: value.isPinned,
    toolbarVisible: value.toolbarVisible !== false,
    toolbarSize: value.toolbarSize as ToolbarSize,
  }

  if (value.interfaceTheme !== undefined) settings.interfaceTheme = value.interfaceTheme
  if (value.toolbarColor !== undefined) settings.toolbarColor = value.toolbarColor

  if (value.hideElement !== undefined) {
    const hideElement = normalizeHiddenElements(value.hideElement)
    if (!hideElement) return null
    settings.hideElement = hideElement
  }

  return settings
}
