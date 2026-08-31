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

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const pickerValue = computed(() => `#${toPickerHex(props.modelValue)}`)

function updateColor(event: Event) {
  emit('update:modelValue', fromPickerHex((event.target as HTMLInputElement).value, props.modelValue))
}
</script>

<style>
.toolglows-color-picker-control {
  display: block;
  width: var(--tg-size-control-comfortable, 2.5rem);
  height: var(--tg-size-control-comfortable, 2.5rem);
  padding: 0.15rem;
  background: var(--surface-card, #ffffff);
  border: 2px solid var(--surface-border, #94a3b8);
  border-radius: var(--tg-radius-control, 0.5rem);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35), 0 1px 2px rgba(15, 23, 42, 0.2);
  cursor: pointer;
}

.toolglows-color-picker-control:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.toolglows-color-picker-control::-webkit-color-swatch-wrapper {
  padding: 0;
}

.toolglows-color-picker-control::-webkit-color-swatch {
  border: 0;
  border-radius: calc(var(--tg-radius-control, 0.5rem) - 0.2rem);
}
</style>
