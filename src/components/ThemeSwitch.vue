<script lang="ts" setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const isDark = computed(() => settingsStore.settings.interfaceTheme === 'dark')

function toggleDark() {
  void settingsStore.updateSettings({
    interfaceTheme: isDark.value ? 'light' : 'dark'
  })
}
</script>

<template>
  <button
    class="btn-ghost text-primary"
    @click="toggleDark()"
  >
    <template v-if="isDark">
      <i-ph-moon />
    </template>
    <template v-else>
      <i-ph-sun />
    </template>
    Theme
  </button>
</template>
