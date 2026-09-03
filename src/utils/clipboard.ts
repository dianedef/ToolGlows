interface EditableSelectionSnapshot {
  element: HTMLInputElement | HTMLTextAreaElement
  start: number | null
  end: number | null
  direction: 'forward' | 'backward' | 'none' | null
}

interface ClipboardInteractionSnapshot {
  activeElement: HTMLElement | null
  ranges: Range[]
  editableSelection: EditableSelectionSnapshot | null
}

function captureInteraction(): ClipboardInteractionSnapshot {
  const selection = window.getSelection()
  const activeElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null
  const editableSelection = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement
    ? {
        element: activeElement,
        start: activeElement.selectionStart,
        end: activeElement.selectionEnd,
        direction: activeElement.selectionDirection
      }
    : null

  return {
    activeElement,
    ranges: selection
      ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange())
      : [],
    editableSelection
  }
}

function restoreInteraction(snapshot: ClipboardInteractionSnapshot): void {
  const selection = window.getSelection()
  if (selection && snapshot.ranges.length > 0) {
    selection.removeAllRanges()
    snapshot.ranges.forEach(range => selection.addRange(range))
  }

  if (snapshot.activeElement?.isConnected) {
    snapshot.activeElement.focus({ preventScroll: true })
  }

  const editable = snapshot.editableSelection
  if (editable?.element.isConnected && editable.start !== null && editable.end !== null) {
    editable.element.setSelectionRange(editable.start, editable.end, editable.direction ?? undefined)
  }
}

function copyWithLegacyCommand(text: string): boolean {
  const snapshot = captureInteraction()
  const textarea = document.createElement('textarea')

  try {
    textarea.value = text
    textarea.readOnly = true
    textarea.dataset.toolglowsAutoCopyFallback = 'true'
    textarea.style.position = 'fixed'
    textarea.style.inset = '0 auto auto -10000px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
    restoreInteraction(snapshot)
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  let copiedByEvent = false
  const handleCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return
    event.preventDefault()
    event.clipboardData.setData('text/plain', text)
    copiedByEvent = true
  }

  document.addEventListener('copy', handleCopy, { capture: true, once: true })
  try {
    if (document.execCommand('copy') && copiedByEvent) return true
  } catch {
    // Continue with the modern asynchronous API.
  } finally {
    document.removeEventListener('copy', handleCopy, true)
  }

  if (navigator.clipboard?.writeText) {
    try {
      // Calling the API before the first await preserves the user activation.
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Older pages and restrictive policies can still require the legacy path.
    }
  }

  return copyWithLegacyCommand(text)
}
