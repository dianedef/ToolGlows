<script setup lang="ts">
import { FormKit } from '@formkit/vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

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
      {
        $formkit: 'toggle',
        name: 'searchJumper.shortcuts',
        label: 'Activer les raccourcis'
      },
      {
        $formkit: 'toggle',
        name: 'searchJumper.contextMenu',
        label: 'Menu contextuel'
      },
      {
        $el: 'h2',
        children: '📖 Mode Lecture'
      },
      {
        $formkit: 'number',
        name: 'readerMode.fontSize',
        label: 'Taille de police',
        min: 12,
        max: 24
      },
      {
        $formkit: 'select',
        name: 'readerMode.fontFamily',
        label: 'Police',
        options: ['Arial', 'Times New Roman', 'Georgia']
      },
      {
        $formkit: 'select',
        name: 'readerMode.theme',
        label: 'Thème',
        options: ['light', 'dark', 'sepia']
      }
    ]
  }
]

async function saveSettings(newSettings: any) {
  await settingsStore.updateSettings(newSettings)
}
</script>

<template>
  <div class="options-page">
    <h1>⚙️ Paramètres Toolflowz</h1>
    
    <FormKit 
      v-model="settings"
      type="form"
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