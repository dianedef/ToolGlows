interface ReloadableTab {
  id?: number
}

interface TabsApi {
  query(queryInfo: Record<string, never>): Promise<ReloadableTab[]>
  reload(tabId: number): Promise<void>
}

export interface ReloadAllTabsResult {
  successCount: number
  errorCount: number
}

/**
 * Reload every browser tab while keeping the request's message channel alive
 * long enough for its response to reach the initiating content script.
 */
export async function reloadAllTabs(
  tabsApi: TabsApi,
  initiatingTabId: number | undefined
): Promise<ReloadAllTabsResult> {
  const tabs = await tabsApi.query({})
  let successCount = 0
  let errorCount = 0

  for (const tab of tabs) {
    if (tab.id === undefined || tab.id === initiatingTabId) continue

    try {
      void tabsApi.reload(tab.id).catch(error => {
        console.warn(`[BACKGROUND] Could not reload tab ${tab.id}:`, error)
      })
      successCount++
    } catch (error) {
      console.warn(`[BACKGROUND] Could not reload tab ${tab.id}:`, error)
      errorCount++
    }
  }

  if (initiatingTabId !== undefined) {
    successCount++
  }

  return { successCount, errorCount }
}
