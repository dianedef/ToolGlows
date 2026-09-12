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

async function reloadWithTimeout(tabsApi: TabsApi, tabId: number, timeoutMs: number): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      tabsApi.reload(tabId),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Reload timed out for tab ${tabId}`)), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}

/**
 * Reload every browser tab while keeping the request's message channel alive
 * long enough for its response to reach the initiating content script.
 */
export async function reloadAllTabs(
  tabsApi: TabsApi,
  initiatingTabId: number | undefined,
  timeoutMs = 5_000,
): Promise<ReloadAllTabsResult> {
  const tabs = await tabsApi.query({})
  let successCount = 0
  let errorCount = 0

  const results = await Promise.allSettled(
    tabs.flatMap(tab =>
      tab.id === undefined || tab.id === initiatingTabId
        ? []
        : [reloadWithTimeout(tabsApi, tab.id, timeoutMs)],
    ),
  )

  successCount = results.filter(result => result.status === 'fulfilled').length
  errorCount = results.length - successCount

  if (initiatingTabId !== undefined) {
    successCount++
  }

  return { successCount, errorCount }
}
