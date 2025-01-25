export interface QuickAction {
  id: string
  icon: string
  label: string
  shortcut?: string
  category: string
  handler: () => Promise<void> | void
}

export interface ComponentQuickActions {
  componentId: string
  actions: QuickAction[]
} 