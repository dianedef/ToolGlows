<template>
  <Menu
    ref="menu"
    v-model:visible="visible"
    :model="items"
    :popup="true"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px'
    }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Menu from 'primevue/menu'
import Button from 'primevue/button'

const props = defineProps<{
  items: Array<{
    label: string
    icon?: string
    command?: () => void
    items?: Array<{
      label: string
      icon?: string
      command?: () => void
    }>
  }>
}>()

const menu = ref()
const visible = ref(false)
const position = ref({ x: 0, y: 0 })

const show = (event: MouseEvent) => {
  event.preventDefault()
  position.value.x = event.clientX
  position.value.y = event.clientY
  visible.value = true
}

const hide = () => {
  visible.value = false
}

onMounted(() => {
  document.addEventListener('contextmenu', show)
  document.addEventListener('click', hide)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', show)
  document.removeEventListener('click', hide)
})
</script>

<style scoped>
:deep(.p-menu) {
  position: fixed !important;
  margin: 0;
  padding: var(--tg-space-2);
  background: var(--surface-overlay);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  box-shadow: var(--overlay-shadow);
}

:deep(.p-menuitem) {
  margin-bottom: var(--tg-space-1);
}

:deep(.p-menuitem:last-child) {
  margin-bottom: 0;
}

:deep(.p-menuitem-link) {
  padding: var(--tg-space-2) 0.75rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
}

:deep(.p-menuitem-icon) {
  margin-right: var(--tg-space-2);
}

:deep(.p-submenu-icon) {
  margin-left: var(--tg-space-2);
}
</style> 