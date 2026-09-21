import { ref, onMounted, onUnmounted } from "vue"
import { useRichCopyStore } from "@/stores/richCopy"
import {
  bridgeApi,
  type TabQueryScope,
  type TabSummary,
  type TabGroupSummary,
} from "@/bridge"
import { copyTextToClipboard } from "@/utils/clipboard"
import { useToast } from "primevue/usetoast"

export function useRichCopy() {
  const store = useRichCopyStore()
  const toast = useToast()
  const isCopying = ref(false)
  const tabGroups = ref<TabGroupSummary[]>([])
  const isLoadingGroups = ref(false)

  const loadTabGroups = async () => {
    isLoadingGroups.value = true
    try {
      tabGroups.value = await bridgeApi.getTabGroups()
    } catch (err) {
      console.error("[Rich Copy] Failed to load tab groups:", err)
      tabGroups.value = []
    } finally {
      isLoadingGroups.value = false
    }
  }

  const formatTab = (tab: TabSummary, templateStr: string): string => {
    const now = new Date()
    const values: Record<string, string> = {
      title: tab.title,
      url: tab.url,
      date: now.toLocaleDateString(),
      datetime: now.toLocaleString(),
    }
    return templateStr.replace(
      /{(title|url|date|datetime)}/g,
      (_match, key: string) => values[key],
    )
  }

  const getTemplateForFormat = (formatId?: string): string => {
    const id = formatId || store.options.defaultFormat
    const format = store.options.formats.find((f) => f.id === id)
    return format?.template || "[{title}]({url})"
  }

  const copyTabs = async (
    scope: TabQueryScope,
    options?: { groupId?: number; formatId?: string; groupTitle?: string },
  ): Promise<boolean> => {
    isCopying.value = true
    try {
      const tabs = await bridgeApi.getTabs(scope, options?.groupId)

      if (tabs.length === 0) {
        toast.add({
          severity: "warn",
          summary: "Aucun onglet",
          detail: "Aucun onglet trouvé pour cette sélection",
          life: 3000,
        })
        return false
      }

      const template = getTemplateForFormat(options?.formatId)
      let formattedText = tabs.map((tab) => formatTab(tab, template)).join("\n")

      if (store.options.customReplacements?.length) {
        for (const replacement of store.options.customReplacements) {
          if (replacement.search) {
            formattedText = formattedText.split(replacement.search).join(replacement.replace)
          }
        }
      }

      // Tab metadata is fetched asynchronously before writing. Do not use the
      // page-origin Clipboard API here: Chrome may prompt the host site on every
      // write once the original click activation has been consumed by the bridge.
      const success = await copyTextToClipboard(formattedText, { allowModernApi: false })
      if (success) {
        const count = tabs.length
        let label = ""
        if (scope === "current") label = "Onglet courant"
        else if (scope === "selected")
          label = `${count} onglet(s) sélectionné(s)`
        else if (scope === "group")
          label = `Groupe "${options?.groupTitle || "Sans nom"}" (${count})`
        else label = `Tous les onglets (${count})`

        toast.add({
          severity: "success",
          summary: "Lien copié !",
          detail: `${label} copié dans le presse-papiers`,
          life: 3000,
        })
        return true
      }
      throw new Error("Clipboard write failed")
    } catch (err) {
      console.error("[Rich Copy] Erreur lors de la copie:", err)
      toast.add({
        severity: "error",
        summary: "Erreur",
        detail: "Impossible de copier les onglets",
        life: 3000,
      })
      return false
    } finally {
      isCopying.value = false
    }
  }

  const copyCurrentTab = (formatId?: string) =>
    copyTabs("current", { formatId })
  const copySelectedTabs = (formatId?: string) =>
    copyTabs("selected", { formatId })
  const copyGroupTabs = (
    groupId: number,
    groupTitle: string,
    formatId?: string,
  ) => copyTabs("group", { groupId, groupTitle, formatId })
  const copyAllTabs = (formatId?: string) => copyTabs("window", { formatId })

  const handleGlobalShortcut = (event: KeyboardEvent) => {
    if (["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName))
      return

    const matchedFormat = store.options.formats.find((f) => {
      if (!f.shortcut) return false
      const keys = f.shortcut.toLowerCase().split("+")
      return keys.every((key) => {
        switch (key) {
          case "alt":
            return event.altKey
          case "ctrl":
            return event.ctrlKey
          case "shift":
            return event.shiftKey
          default:
            return event.key.toLowerCase() === key
        }
      })
    })

    if (matchedFormat) {
      event.preventDefault()
      void copyTabs("selected", { formatId: matchedFormat.id })
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleGlobalShortcut)
  })

  onUnmounted(() => {
    window.removeEventListener("keydown", handleGlobalShortcut)
  })

  return {
    isCopying,
    tabGroups,
    isLoadingGroups,
    loadTabGroups,
    copyTabs,
    copyCurrentTab,
    copySelectedTabs,
    copyGroupTabs,
    copyAllTabs,
  }
}
