import { CONTENT_SCRIPT_STATUS_MESSAGE } from '../utils/contentScriptStatus'

/** Probe the maintained status endpoint before queuing a bridge transaction. */
export async function isContentScriptReady(tabId: number, timeoutMs = 300): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const response = await Promise.race([
      chrome.tabs.sendMessage(tabId, { type: CONTENT_SCRIPT_STATUS_MESSAGE }, { frameId: 0 }),
      new Promise<undefined>(resolve => { timer = setTimeout(() => resolve(undefined), timeoutMs) })
    ])
    return response?.ready === true
  } catch {
    // Tabs without our content script (or navigating away) cannot receive updates.
    return false
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
