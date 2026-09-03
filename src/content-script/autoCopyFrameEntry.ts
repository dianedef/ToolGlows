import { copyTextToClipboard } from '@/utils/clipboard'

interface FrameState {
  enabled: boolean
  showNotifications: boolean
}

const state: FrameState = { enabled: false, showNotifications: true }
let isCopying = false
let pointerSelectionAtStart: string | null = null
let keyboardSelectionAtStart: string | null = null
let selectionTimer: number | null = null
let statusTimer: number | null = null

function showResult(success: boolean): void {
  if (!state.showNotifications) return
  if (statusTimer !== null) window.clearTimeout(statusTimer)
  document.getElementById('toolglows-frame-copy-status')?.remove()
  const status = document.createElement('div')
  status.id = 'toolglows-frame-copy-status'
  status.dataset.toolglowsUi = 'true'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.setAttribute('aria-label', success ? 'Text copied' : 'Copy failed')
  const shadow = status.attachShadow({ mode: 'closed' })
  const style = document.createElement('style')
  const message = document.createElement('span')
  style.textContent = `
    :host {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 2147482000;
    }
    span {
      display: block;
      padding: 0.75rem 1rem;
      border: 1px solid ButtonBorder;
      border-radius: 0.5rem;
      background: Canvas;
      color: CanvasText;
      box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 22%);
      font: 600 0.875rem/1.4 system-ui, sans-serif;
      animation: enter 300ms cubic-bezier(.2, .8, .2, 1) both;
    }
    :host([data-leaving='true']) span {
      animation: leave 180ms ease-in both;
    }
    @keyframes enter {
      from { opacity: 0; transform: translateY(0.75rem); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes leave {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(0.5rem); }
    }
    @media (prefers-reduced-motion: reduce) {
      span, :host([data-leaving='true']) span {
        animation-duration: 1ms;
        transform: none;
      }
    }
  `
  message.textContent = success ? 'Text copied' : 'Copy failed'
  shadow.append(style, message)
  document.documentElement.appendChild(status)
  statusTimer = window.setTimeout(() => {
    status.dataset.leaving = 'true'
    statusTimer = window.setTimeout(() => {
      status.remove()
      statusTimer = null
    }, 180)
  }, 1800)
}

function scheduleSelectionExpiry(target: EventTarget | null, copiedText: string): void {
  if (selectionTimer !== null) window.clearTimeout(selectionTimer)
  selectionTimer = window.setTimeout(() => {
    if (selectedText(target) === copiedText) {
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const end = target.selectionEnd ?? target.value.length
        target.setSelectionRange(end, end)
      } else {
        window.getSelection()?.removeAllRanges()
      }
    }
    selectionTimer = null
  }, 1500)
}

function selectedText(target: EventTarget | null): string {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    if (target instanceof HTMLInputElement && target.type === 'password') return ''
    const start = target.selectionStart
    const end = target.selectionEnd
    if (start === null || end === null || start === end) return ''
    return target.value.slice(Math.min(start, end), Math.max(start, end))
  }

  return window.getSelection()?.toString() ?? ''
}

async function copyFrameSelection(event: PointerEvent | KeyboardEvent): Promise<void> {
  if (!state.enabled || isCopying) return
  if (event instanceof KeyboardEvent) {
    const completed = event.key === 'Shift'
      || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')
    if (!completed) return
    const text = selectedText(event.target)
    if (keyboardSelectionAtStart !== null && keyboardSelectionAtStart === text) {
      keyboardSelectionAtStart = null
      return
    }
    keyboardSelectionAtStart = null
  } else {
    const text = selectedText(event.target)
    if (pointerSelectionAtStart !== null && pointerSelectionAtStart === text) {
      pointerSelectionAtStart = null
      return
    }
    pointerSelectionAtStart = null
  }

  const text = selectedText(event.target)
  if (!text) return

  isCopying = true
  const success = await copyTextToClipboard(text)
  isCopying = false
  if (success) scheduleSelectionExpiry(event.target, text)
  showResult(success)
}

async function syncState(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(['toolglowsSettings', 'autoCopySettings'])
    const activeTools = result.toolglowsSettings?.activeTools
    state.enabled = Array.isArray(activeTools) && activeTools.includes('autoCopy')
    state.showNotifications = result.autoCopySettings?.showNotifications !== false
    if (!state.enabled) {
      if (selectionTimer !== null) window.clearTimeout(selectionTimer)
      selectionTimer = null
      pointerSelectionAtStart = null
      keyboardSelectionAtStart = null
      document.getElementById('toolglows-frame-copy-status')?.remove()
    }
  } catch {
    state.enabled = false
  }
}

if (window !== window.top) {
  void syncState()
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && (changes.toolglowsSettings || changes.autoCopySettings)) void syncState()
  })
  document.addEventListener('pointerup', event => void copyFrameSelection(event))
  document.addEventListener('pointerdown', event => {
    if (state.enabled) pointerSelectionAtStart = selectedText(event.target)
  }, true)
  document.addEventListener('keyup', event => void copyFrameSelection(event))
  document.addEventListener('keydown', event => {
    if (!state.enabled || event.repeat) return
    const startsSelection = event.key === 'Shift'
      || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')
    if (startsSelection) keyboardSelectionAtStart = selectedText(event.target)
  })
}

export {}
