<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
// ... other imports ...

const themeStore = useThemeStore()

onMounted(async () => {
  await themeStore.loadTheme()
  // ... other initialization code ...
})
</script> 