<script setup lang="ts">
import { Notivue, Notification } from 'notivue'
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useInterfaceTheme } from '@/composables/useInterfaceTheme'

const settingsStore = useSettingsStore()
const isReady = ref(false)
useInterfaceTheme(settingsStore)

onMounted(async () => {
  try {
    await settingsStore.loadSettings()
  } finally {
    isReady.value = true
  }
})
</script>

<template>
  <div v-if="isReady" class="extension-shell options-shell">
    <AppHeader />

    <main class="extension-content prose">
      <RouterView />
    </main>

    <AppFooter />

    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<style scoped>
.extension-shell { min-height: 100vh; background: var(--tg-surface-canvas); color: var(--tg-text-primary); }
.extension-content { padding: clamp(var(--tg-space-3), 4vw, var(--tg-space-6)); }
</style>
