import { computed, watch, type ComputedRef } from 'vue'
import type { useSettingsStore } from '@/stores/settings'

export function normalizeInterfaceTheme(value: unknown): 'light' | 'dark' {
  return value === 'dark' ? 'dark' : 'light'
}

export function applyInterfaceTheme(
  theme: 'light' | 'dark',
  root: HTMLElement = document.documentElement
) {
  root.dataset.theme = theme
  if (root === document.documentElement) {
    document.body?.setAttribute('data-theme', theme)
  }
}

export function useInterfaceTheme(
  settingsStore: ReturnType<typeof useSettingsStore>
): { interfaceTheme: ComputedRef<'light' | 'dark'> } {
  const interfaceTheme = computed(() => normalizeInterfaceTheme(settingsStore.settings.interfaceTheme))
  watch(interfaceTheme, theme => applyInterfaceTheme(theme), { immediate: true })
  return { interfaceTheme }
}
