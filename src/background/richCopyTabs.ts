import { assertInternalBridgeSender } from "./messageSecurity"
import type { TabSummary, TabGroupSummary } from "../bridge"

type Sender = { context: string; tabId?: number }
type BrowserApi = Pick<typeof chrome, "tabs" | "tabGroups" | "windows">

async function senderWindow(
  api: BrowserApi,
  sender: Sender,
): Promise<{ windowId: number } | { currentWindow: true }> {
  if (sender.context !== "content-script") return { currentWindow: true }
  if (!Number.isInteger(sender.tabId) || sender.tabId! < 0)
    throw new Error("Invalid sender tab")
  const tab = await api.tabs.get(sender.tabId!)
  if (!Number.isInteger(tab.windowId) || tab.windowId < 0)
    throw new Error("Invalid sender window")
  return { windowId: tab.windowId }
}

export async function getRichCopyTabs(
  api: BrowserApi,
  data: unknown,
  sender: Sender,
): Promise<TabSummary[]> {
  assertInternalBridgeSender(sender)
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid tab query")
  const { scope, groupId } = data as Record<string, unknown>
  if (
    typeof scope !== "string" ||
    !["current", "selected", "window", "all", "group"].includes(scope)
  )
    throw new Error("Invalid tab query scope")
  if (
    scope === "group" &&
    (typeof groupId !== "number" || !Number.isInteger(groupId) || groupId < 0)
  ) {
    throw new Error("Invalid tab group")
  }
  const window = await senderWindow(api, sender)
  const query: Parameters<typeof chrome.tabs.query>[0] = scope === "all" ? {} : { ...window }
  if (scope === "current") query.active = true
  if (scope === "selected") query.highlighted = true
  if (scope === "group") query.groupId = groupId as number
  const tabs = await api.tabs.query(query)
  return tabs
    .sort((a, b) => a.windowId - b.windowId || a.index - b.index)
    .flatMap((tab) =>
      tab.url ? [{ title: tab.title || tab.url, url: tab.url }] : [],
    )
}

export async function getRichCopyTabGroups(
  api: BrowserApi,
  sender: Sender,
): Promise<TabGroupSummary[]> {
  assertInternalBridgeSender(sender)
  if (!api.tabGroups?.query) return []
  const window = await senderWindow(api, sender)
  const groups = await api.tabGroups.query({
    windowId:
      "windowId" in window ? window.windowId : api.windows.WINDOW_ID_CURRENT,
  })
  const tabs = await api.tabs.query(window)
  return groups.map((group) => ({
    id: group.id,
    title: group.title || "Sans nom",
    color: group.color,
    collapsed: group.collapsed,
    tabCount: tabs.filter((tab) => tab.groupId === group.id).length,
  }))
}
