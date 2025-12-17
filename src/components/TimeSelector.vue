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
  padding: 0.5rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
  background: var(--surface-ground);
  color: var(--text-color);
  width: 100px;
}

.time-selector input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}
</style> 