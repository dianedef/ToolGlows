/** Optional delivery must not keep the sender's bridge transaction open.
 * Dormant tabs recover persisted state when their content script initializes.
 */
export function notifyAfterAcceptance(notify: () => Promise<unknown>): void {
  void Promise.resolve().then(notify).catch(error => {
    console.error('[BACKGROUND] Cross-tab delivery failed:', error)
  })
}

export async function persistThenNotify(
  persist: () => Promise<unknown>,
  notify: () => Promise<unknown>
): Promise<{ success: true }> {
  await persist()
  notifyAfterAcceptance(notify)
  return { success: true }
}
