<template>
  <div 
    v-if="!isLoading"
    ref="toolbarRef"
    class="toolflowz-bar" 
    :style="style"
    :class="{ 
      expanded: settingsStore.settings.expanded || settingsStore.settings.isPinned,
      dragging: isDragging 
    }"
  >
    <!-- Bouton principal -->
    <Button 
      class="main-button p-button-rounded"
      :icon="settingsStore.settings.expanded || settingsStore.settings.isPinned ? 'pi pi-times' : 'pi pi-bars'"
      @click="handleMainButtonClick"
      text
      raised
      aria-label="Toolflowz"
    >
      <span class="tool-emoji">🔧</span>
    </Button>

    <!-- Barre d'outils -->
    <div v-if="settingsStore.settings.expanded" class="tools-container">
      <!-- Bouton paramètres -->
      <Button 
        class="p-button-rounded p-button-text"
        @click="showSettings = !showSettings"
        severity="secondary"
        aria-label="Paramètres"
      >
        <span class="tool-emoji">⚙️</span>
      </Button>

      <!-- Boutons des outils actifs -->
      <template v-for="tool in toolflowzStore.tools" :key="tool.id">
        <Button 
          v-if="toolflowzStore.activeTools.includes(tool.id)"
          class="p-button-rounded p-button-text"
          @click="currentToolId = currentToolId === tool.id ? null : tool.id"
          :aria-label="tool.name"
        >
          <span class="tool-emoji">{{ tool.emoji }}</span>
        </Button>
      </template>
    </div>

    <!-- Composants des outils actifs -->
    <template v-for="tool in toolflowzStore.tools" :key="tool.id">
      <component
        v-if="toolflowzStore.activeTools.includes(tool.id)"
        :is="tool.component"
        v-model="currentToolId"
        :visible="currentToolId === tool.id"
        @update:visible="(val: boolean) => currentToolId = val ? tool.id : null"
        data-toolflowz-component
      />
    </template>

    <!-- Panneau des paramètres -->
    <Dialog
      v-model:visible="showSettings"
      modal
      :dismissableMask="true"
      header="⚙️ Paramètres"
      :style="{ width: '50vw' }"
      :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
      @hide="closeSettings"
    >
      <div class="settings-content">
        <!-- Paramètres généraux -->
        <h3>🔧 Général</h3>
        <div class="setting-item">
          <Checkbox
          v-model="autoHide"
          :binary="true"
          inputId="autoHide"
          />
          <label for="autoHide">Masquer automatiquement</label>
        </div>
        <div class="setting-item">
          <Checkbox 
            v-model="settingsStore.settings.isPinned"
            :binary="true"
            inputId="pinBar"
          />
          <label for="pinBar">Épingler la barre d'outils</label>
        </div>
        
        <!-- Gestion des outils -->
        <h3>🛠️ Outils actifs</h3>
        <div class="tools-grid">
          <div v-for="tool in toolflowzStore.tools" :key="tool.id" class="tool-item">
            <Checkbox
              :modelValue="toolflowzStore.activeTools.includes(tool.id)"
              @update:modelValue="() => toolflowzStore.toggleTool(tool.id)"
              :binary="true"
              :inputId="'tool-' + tool.id"
            />
            <div class="tool-header">
              <span class="tool-emoji">{{ tool.emoji }}</span>
              <label :for="'tool-' + tool.id" class="tool-name">{{ tool.name }}</label>
            </div>
          </div>
        </div>

      </div>
    </Dialog>
  </div>
  <div v-else class="loading">
    ⌛ Chargement...
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, markRaw, onUnmounted, computed, watch } from 'vue'
import type { Tool } from '@/types/tools'
import { useSettingsStore } from '@/stores/settings'
import { useToolflowzStore } from '@/stores/toolflowz'
import { useInstantOCRStore } from '@/stores/instantOCR'
import { useWordCounterStore } from '@/stores/wordCounter'
import WordCounterPopup from './WordCounterPopup.vue'
import InstantOCRControl from './InstantOCRControl.vue'
import DarkModeControl from './DarkModeControl.vue'
import SpeedBrowsingControl from './SpeedBrowsingControl.vue'
import InfiniteScrollControl from './InfiniteScrollControl.vue'
import FeedEradicatorControl from './FeedEradicatorControl.vue'
import ReaderModeControl from './ReaderModeControl.vue'
import SearchJumperUI from './SearchJumperUI.vue'
import DragOpenControl from './DragOpenControl.vue'
import InstagramSavedLibrary from './InstagramSavedLibrary.vue'
import RichCopyControl from './RichCopyControl.vue'
import BetterGmailControl from './BetterGmailControl.vue'
import QuickActionsControl from './QuickActionsControl.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { useDraggable, onClickOutside } from '@vueuse/core'

// États locaux
const isExpanded = ref(false)
const showSettings = ref(false)
const autoHide = ref(false)
const isLoading = ref(true)
const currentToolId = ref<string | null>(null)
const position = ref({ x: 0, y: 0 })

// Injection des stores avec typage
const settingsStore = inject('settingsStore') as ReturnType<typeof useSettingsStore>
const toolflowzStore = inject('toolflowzStore') as ReturnType<typeof useToolflowzStore>
const ocrStore = inject('ocrStore') as ReturnType<typeof useInstantOCRStore>
const wordCounterStore = inject('wordCounterStore') as ReturnType<typeof useWordCounterStore>

if (!settingsStore || !toolflowzStore || !ocrStore || !wordCounterStore) {
  throw new Error('Les stores requis n\'ont pas été injectés')
}

// Configuration des outils
const initialTools: Tool[] = [
  {
    id: 'wordCount',
    name: 'Compteur de mots',
    component: markRaw(WordCounterPopup),
    icon: 'pi pi-calculator',
    emoji: '📝',
    category: 'reading'
  },
  {
    id: 'ocr',
    name: 'OCR instantané',
    component: markRaw(InstantOCRControl),
    icon: 'pi pi-camera',
    emoji: '📸',
    category: 'reading'
  },
  {
    id: 'darkMode',
    name: 'Mode sombre',
    component: markRaw(DarkModeControl),
    icon: 'pi pi-moon',
    emoji: '🌙',
    category: 'appearance'
  },
  {
    id: 'speedBrowsing',
    name: 'Navigation rapide',
    component: markRaw(SpeedBrowsingControl),
    icon: 'pi pi-forward',
    emoji: '⚡',
    category: 'navigation'
  },
  {
    id: 'infiniteScroll',
    name: 'Défilement infini',
    component: markRaw(InfiniteScrollControl),
    icon: 'pi pi-arrow-down',
    emoji: '♾️',
    category: 'navigation'
  },
  {
    id: 'feedEradicator',
    name: 'Éradicateur de flux',
    component: markRaw(FeedEradicatorControl),
    icon: 'pi pi-ban',
    emoji: '🚫',
    category: 'social'
  },
  {
    id: 'readerMode',
    name: 'Mode lecture',
    component: markRaw(ReaderModeControl),
    icon: 'pi pi-book',
    emoji: '📖',
    category: 'reading'
  },
  {
    id: 'searchJumper',
    name: 'Recherche rapide',
    component: markRaw(SearchJumperUI),
    icon: 'pi pi-search',
    emoji: '🔍',
    category: 'navigation'
  },
  {
    id: 'dragOpen',
    name: 'Glisser-déposer',
    component: markRaw(DragOpenControl),
    icon: 'pi pi-arrows-alt',
    emoji: '🔄',
    category: 'navigation'
  },
  {
    id: 'instagramSaved',
    name: 'Bibliothèque Instagram',
    component: markRaw(InstagramSavedLibrary),
    icon: 'pi pi-instagram',
    emoji: '📸',
    category: 'social'
  },
  {
    id: 'richCopy',
    name: 'Copie enrichie',
    component: markRaw(RichCopyControl),
    icon: 'pi pi-copy',
    emoji: '📋',
    category: 'reading'
  },
  {
    id: 'betterGmail',
    name: 'Gmail amélioré',
    component: markRaw(BetterGmailControl),
    icon: 'pi pi-envelope',
    emoji: '📧',
    category: 'social'
  },
  {
    id: 'quickActions',
    name: 'Actions rapides',
    component: markRaw(QuickActionsControl),
    icon: 'pi pi-bolt',
    emoji: '⚡',
    category: 'navigation'
  }
]

// Ajout de la référence pour la barre d'outils
const toolbarRef = ref<HTMLElement | null>(null)

// Configuration du drag
const { style, isDragging, position: dragPosition } = useDraggable(toolbarRef, {
  initialValue: {
    x: settingsStore.settings.position.x,
    y: settingsStore.settings.position.y
  },
  onEnd: (position) => {
    settingsStore.updatePosition(position.x, position.y)
  }
})

// Ajout du composable onClickOutside
onClickOutside(toolbarRef, () => {
  if (!settingsStore.settings.isPinned) {
    settingsStore.updateSettings({ expanded: false })
  }
})

// Ajouter un watcher pour gérer l'expanded quand isPinned change
watch(() => settingsStore.settings.isPinned, (isPinned) => {
  if (isPinned) {
    settingsStore.updateSettings({ expanded: true })
  }
})

onMounted(async () => {
  try {
    await settingsStore.loadSettings()
    
    dragPosition.value = {
      x: settingsStore.settings.position.x,
      y: settingsStore.settings.position.y
    }
    
    console.log('[INFO] Initializing tools')
    await toolflowzStore.initTools(initialTools)
    
    isLoading.value = false
    console.log('[SUCCESS] Initialization complete')
  } catch (error) {
    console.error('[ERROR] Initialization error:', error)
    isLoading.value = false
  }
})

const closeSettings = () => {
  showSettings.value = false
}

const handleMainButtonClick = () => {
  settingsStore.updateSettings({ expanded: !settingsStore.settings.expanded })
}
</script>

<style scoped>
.loading {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 8px;
  z-index: 1000;
}

.toolflowz-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 2rem;
  background: var(--surface-card);
  box-shadow: var(--card-shadow);
  z-index: 1000;
  user-select: none;
  position: fixed;
  cursor: move;

  &.dragging {
    cursor: grabbing;
  }
}

.tools-container {
  display: flex;
  gap: 0.5rem;
}

.tool-icon {
  font-size: 1.2rem;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tools-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.tool-emoji {
  font-size: 1.2rem;
}

.tool-name {
  color: var(--text-color);
  font-size: 0.9rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}
</style> 
