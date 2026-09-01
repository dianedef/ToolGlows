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
  <div v-if="isReady">
    <AppHeader />

    <div class="p-4 prose">
      <RouterView />
    </div>

    <AppFooter />

    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<style scoped></style>
