<template>
  <div class="time-selector">
    <input 
      type="time" 
      :value="modelValue"
      class="p-inputtext"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.time-selector input {
  padding: var(--tg-space-2);
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
  background: var(--surface-ground);
  color: var(--text-color);
  width: var(--tg-size-100);
}

.time-selector input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}
</style> 
