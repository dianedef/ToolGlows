<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useInterfaceTheme } from '@/composables/useInterfaceTheme'
// ... other imports ...

const settingsStore = useSettingsStore()
useInterfaceTheme(settingsStore)

onMounted(async () => {
  await settingsStore.loadSettings()
  // ... other initialization code ...
})
</script>
