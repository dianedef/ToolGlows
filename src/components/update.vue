<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

const displayName = __DISPLAY_NAME__
const version = __VERSION__
</script>

<template>
  <div class="update-container">
    <Card>
      <template #title>
        <div class="update-header">
          <h1 class="text-4xl font-bold text-center">🎉 Mise à jour ! 🎉</h1>
          <Message severity="success" :closable="false">
            {{ displayName }} a été mis à jour vers la dernière version.
          </Message>
          <Message severity="info" :closable="false">
            Version : {{ version }}
          </Message>
        </div>
      </template>

      <template #content>
        <Divider />
        <h2 class="text-2xl font-bold mb-4">Nouveautés</h2>
        <Changelog />
      </template>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.update-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.update-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

:deep(.p-card) {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
}

:deep(.p-message) {
  width: 100%;
  margin: 0;
}
</style>
