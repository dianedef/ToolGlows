<template>
  <input
    type="color"
    class="toolglows-color-picker-control"
    :value="pickerValue"
    aria-label="Sélectionner une couleur"
    @input="updateColor"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { fromPickerHex, toPickerHex } from '@/utils/colorPicker'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const pickerValue = computed(() => `#${toPickerHex(props.modelValue)}`)

function updateColor(event: Event) {
  emit('update:modelValue', fromPickerHex((event.target as HTMLInputElement).value, props.modelValue))
}
</script>

<style>
.toolglows-color-field.toolglows-color-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-4);
  width: var(--tg-full-width);
}

.toolglows-color-field > :first-child {
  flex: 1;
  margin: 0;
}

.toolglows-color-picker-control {
  display: block;
  width: var(--tg-size-control-comfortable) !important;
  min-width: var(--tg-size-control-comfortable);
  height: var(--tg-size-control-comfortable) !important;
  min-height: var(--tg-size-control-comfortable);
  flex: 0 0 var(--tg-size-control-comfortable);
  padding: 0 !important;
  background: transparent;
  border: 1px solid var(--tg-border-default);
  border-radius: var(--tg-radius-control);
  box-shadow: var(--tg-shadow-control);
  overflow: hidden;
  cursor: pointer;
}

.toolglows-color-picker-control:focus-visible {
  outline: 2px solid var(--tg-action);
  outline-offset: var(--tg-space-1);
}

.toolglows-color-picker-control::-webkit-color-swatch-wrapper {
  padding: 0;
}

.toolglows-color-picker-control::-webkit-color-swatch {
  border: 0;
  border-radius: var(--tg-radius-control);
}

.toolglows-color-picker-control::-moz-color-swatch {
  border: 0;
  border-radius: var(--tg-radius-control);
}
</style>
