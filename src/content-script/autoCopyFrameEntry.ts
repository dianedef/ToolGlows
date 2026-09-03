import { copyTextToClipboard } from '@/utils/clipboard'

interface FrameState {
  enabled: boolean
  showNotifications: boolean
}

const state: FrameState = { enabled: false, showNotifications: true }
let isCopying = false

function showResult(success: boolean): void {
  if (!state.showNotifications) return
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
      opacity: 1;
    }
  `
  message.textContent = success ? 'Text copied' : 'Copy failed'
  shadow.append(style, message)
  document.documentElement.appendChild(status)
  window.setTimeout(() => status.remove(), 1800)
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
  }

  const text = selectedText(event.target)
  if (!text) return

  isCopying = true
  const success = await copyTextToClipboard(text)
  isCopying = false
  showResult(success)
}

async function syncState(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get(['toolglowsSettings', 'autoCopySettings'])
    const activeTools = result.toolglowsSettings?.activeTools
    state.enabled = Array.isArray(activeTools) && activeTools.includes('autoCopy')
    state.showNotifications = result.autoCopySettings?.showNotifications !== false
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
  document.addEventListener('keyup', event => void copyFrameSelection(event))
}

export {}
