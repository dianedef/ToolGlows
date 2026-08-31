<template>
  <ToolGlowsColorPicker v-model="toolbarColor" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import ToolGlowsColorPicker from './ToolGlowsColorPicker.vue'

const settingsStore = useSettingsStore()

const toolbarColor = computed({
  get: () => settingsStore.settings.toolbarColor || '#ff69b4',
  set: value => settingsStore.updateSettings({ toolbarColor: value })
})
</script>
