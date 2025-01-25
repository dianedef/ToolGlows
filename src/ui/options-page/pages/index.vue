<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { FormKit } from '@formkit/vue'

const settings = useStorage('toolflowz-settings', {
  darkMode: {
    autoSync: true,
    excludedDomains: [],
    sunsetTime: '19:00',
    sunriseTime: '07:00'
  },
  searchJumper: {
    defaultEngine: 'google',
    shortcuts: true,
    contextMenu: true
  },
  readerMode: {
    fontSize: 18,
    fontFamily: 'Arial',
    theme: 'light'
  },
  richCopy: {
    defaultFormat: 'markdown',
    includeFavicon: true,
    includeSource: true
  }
})

const formSchema = [
  {
    $formkit: 'form',
    children: [
      {
        $el: 'h2',
        children: '🌙 Mode Sombre'
      },
      {
        $formkit: 'toggle',
        name: 'darkMode.autoSync',
        label: 'Synchronisation automatique'
      },
      {
        $formkit: 'taglist',
        name: 'darkMode.excludedDomains',
        label: 'Domaines exclus',
        placeholder: 'example.com'
      },
      {
        $el: 'h2',
        children: '🔍 SearchJumper'
      },
      {
        $formkit: 'select',
        name: 'searchJumper.defaultEngine',
        label: 'Moteur par défaut',
        options: ['google', 'bing', 'duckduckgo']
      },
      // ... autres options
    ]
  }
]

function saveSettings() {
  // Les paramètres sont automatiquement sauvegardés grâce à useStorage
  console.log('Settings saved:', settings.value)
}
</script>

<template>
  <div class="options-page">
    <h1>⚙️ Paramètres Toolflowz</h1>
    
    <FormKit 
      type="form"
      v-model="settings"
      :actions="false"
      :config="{
        classes: {
          input: 'w-full p-2 border rounded',
          label: 'font-medium mb-1 block'
        }
      }"
    >
      <FormKit 
        type="form"
        :schema="formSchema"
        @submit="saveSettings"
      />
    </FormKit>
  </div>
</template>

<style scoped>
.options-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

:deep(h2) {
  margin: 2rem 0 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
