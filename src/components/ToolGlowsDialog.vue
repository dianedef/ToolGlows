<template>
  <Dialog
    v-bind="$attrs"
    v-model:visible="visible"
    modal
    append-to="body"
    :auto-z-index="true"
    :base-z-index="dialogBaseZIndex"
    class="toolglows-dialog"
  >
    <template
      v-if="$slots.header"
      #header
    >
      <slot name="header" />
    </template>

    <slot />

    <template
      v-if="$slots.footer"
      #footer
    >
      <slot name="footer" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { resolveDesignToken } from '@/utils/designTokens'

defineOptions({ inheritAttrs: false })

const visible = defineModel<boolean>('visible', { default: false })
const resolvedDialogBaseZIndex = Number.parseInt(resolveDesignToken('--tg-z-overlay'), 10)
const dialogBaseZIndex = Number.isFinite(resolvedDialogBaseZIndex)
  ? resolvedDialogBaseZIndex
  : 0
</script>
