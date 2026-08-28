<template>
  <div
    v-if="!isLoading"
    ref="toolbarRef"
    class="toolglows-bar"
    :style="toolbarStyle"
    :class="{
      'toolglows-expanded': isExpanded || settingsStore.settings.isPinned,
      'toolglows-dragging': isDragging
    }"
  >
    <Toast position="bottom-right" />
    <!-- Bouton principal -->
    <Button
      class="toolglows-main-button p-button-rounded"
      :icon="isExpanded || settingsStore.settings.isPinned ? 'pi pi-times' : 'pi pi-bars'"
      text
      raised
      aria-label="ToolGlows"
      @click.stop="handleMainButtonClick"
    >
      <span class="toolglows-tool-emoji">🔧</span>
    </Button>

    <!-- Barre d'outils -->
    <div
      v-if="isExpanded"
      class="toolglows-tools-container"
    >
      <!-- Bouton paramètres -->
      <Button
        class="p-button-rounded p-button-text"
        severity="secondary"
        aria-label="Paramètres"
        @click="showSettings = !showSettings"
      >
        <span class="toolglows-tool-emoji">⚙️</span>
      </Button>

      <!-- Boutons des outils actifs -->
      <template
        v-for="tool in toolglowsStore.tools"
        :key="tool.id"
      >
        <Button
          v-if="toolglowsStore.activeTools.includes(tool.id)"
          class="p-button-rounded p-button-text"
          :aria-label="tool.name"
          :title="tool.name"
          @click="() => {
            console.log('[INFO] Tool button clicked:', tool.id)
            isVisible[tool.id] = !isVisible[tool.id]
            console.log('[INFO] Tool visibility updated:', tool.id, isVisible[tool.id])
          }"
        >
          <span class="toolglows-tool-emoji">{{ tool.emoji }}</span>
        </Button>
      </template>
    </div>

    <!-- Composants des outils actifs -->
    <template
      v-for="tool in toolglowsStore.tools"
      :key="tool.id"
    >
      <component
        :is="tool.component"
        v-if="toolglowsStore.activeTools.includes(tool.id)"
        v-model="isVisible[tool.id]"
        :visible="isVisible[tool.id]"
        data-component="toolglows-tool"
        @update:visible="(val: boolean) => isVisible[tool.id] = val"
      />
    </template>
  </div>
  <div
    v-else
    class="toolglows-loading"
  >
    ⌛ Chargement...
  </div>

  <!-- Panneau des paramètres -->
  <Dialog
    v-model:visible="showSettings"
    modal
    :dismissable-mask="true"
    :maximizable="true"
    header="⚙️ Paramètres"
    :style="{ width: '50vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    class="toolglows-settings-dialog"
    append-to="body"
    @hide="closeSettings"
  >
    <div class="toolglows-settings-content">
      <!-- Paramètres généraux -->
      <div class="toolglows-settings-header">
        <h3>🔧 Général</h3>
        <ThemeSwatch />
      </div>
      <div class="toolglows-setting-item">
        <Checkbox
          v-model="autoHide"
          :binary="true"
          input-id="autoHide"
        />
        <label for="autoHide">Masquer automatiquement</label>
      </div>
      <div class="toolglows-setting-item">
        <Checkbox
          v-model="settingsStore.settings.isPinned"
          :binary="true"
          input-id="pinBar"
        />
        <label for="pinBar">Épingler la barre d'outils</label>
      </div>

      <div class="toolglows-setting-item">
        <label for="toolbarSize">Taille de la barre d'outils</label>
        <Dropdown
          v-model="settingsStore.settings.toolbarSize"
          :options="[
            { label: 'Très petite', value: 'xs' },
            { label: 'Petite', value: 'sm' },
            { label: 'Moyenne', value: 'md' },
            { label: 'Grande', value: 'lg' },
            { label: 'Très grande', value: 'xl' }
          ]"
          option-label="label"
          option-value="value"
          class="w-full md:w-14rem"
        />
      </div>

      <!-- Gestion des outils -->
      <h3>🛠️ Outils actifs</h3>
      <div class="toolglows-tools-grid">
        <div
          v-for="tool in toolglowsStore.tools"
          :key="tool.id"
          class="toolglows-tool-item"
        >
          <Checkbox
            :model-value="toolglowsStore.activeTools.includes(tool.id)"
            :binary="true"
            :input-id="'tool-' + tool.id"
            @update:model-value="() => toolglowsStore.toggleTool(tool.id)"
          />
          <div class="toolglows-tool-header">
            <span class="toolglows-tool-emoji">{{ tool.emoji }}</span>
            <label
              :for="'tool-' + tool.id"
              class="toolglows-tool-name"
            >{{ tool.name }}</label>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, markRaw, onUnmounted, computed, watch, nextTick } from 'vue'
import type { Tool } from '@/types/tools'
import { useSettingsStore } from '@/stores/settings'
import { useToolGlowsStore } from '@/stores/toolglows'
import { useInstantOCRStore } from '@/stores/instantOCR'
import { useWordCounterStore } from '@/stores/wordCounter'
import { useAutoCopyStore } from '@/stores/autoCopy'
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
import AutoCopyControl from './AutoCopyControl.vue'
import LinksExplorerControl from './LinksExplorerControl.vue'
import SocialAnalysisControl from './SocialAnalysisControl.vue'
import ReloadAllTabsControl from './ReloadAllTabsControl.vue'
import HideElementControl from './HideElementControl.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import { useDraggable, onClickOutside } from '@vueuse/core'
import Toast from 'primevue/toast'
import { useExcludeToolGlowsBar } from '@/composables/excludeToolGlowsBar'
import ThemeSwatch from './ThemeSwatch.vue'
import { useDebounceFn } from '@vueuse/core'

// États locaux
const isExpanded = ref(false)
const showSettings = ref(false)
const autoHide = ref(false)
const isLoading = ref(true)
const isVisible = ref<Record<string, boolean>>({})
const toolbarRef = ref<HTMLElement | null>(null)

// Injection des stores avec typage
const settingsStore = inject('settingsStore') as ReturnType<typeof useSettingsStore>
const toolglowsStore = inject('toolglowsStore') as ReturnType<typeof useToolGlowsStore>
const ocrStore = inject('ocrStore') as ReturnType<typeof useInstantOCRStore>
const wordCounterStore = inject('wordCounterStore') as ReturnType<typeof useWordCounterStore>
const autoCopyStore = useAutoCopyStore()

if (!settingsStore || !toolglowsStore || !ocrStore || !wordCounterStore) {
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
  },
  {
    id: 'autoCopy',
    name: 'Copie automatique',
    component: markRaw(AutoCopyControl),
    icon: 'pi pi-copy',
    emoji: '✂️',
    category: 'reading'
  },
  {
    id: 'linksExplorer',
    name: 'Explorateur de liens',
    component: markRaw(LinksExplorerControl),
    icon: 'pi pi-link',
    emoji: '🔗',
    category: 'navigation'
  },
  {
    id: 'socialAnalysis',
    name: 'Analyse Sociale',
    component: markRaw(SocialAnalysisControl),
    icon: 'pi pi-users',
    emoji: '👥',
    category: 'social'
  },
  {
    id: 'reloadAllTabs',
    name: 'Recharger les onglets',
    component: markRaw(ReloadAllTabsControl),
    icon: 'pi pi-refresh',
    emoji: '🔄',
    category: 'navigation'
  },
  {
    id: 'hideElement',
    name: 'Masquer des éléments',
    component: markRaw(HideElementControl),
    icon: 'pi pi-eye-slash',
    emoji: '👁️',
    category: 'appearance'
  }
]

// Fonction pour calculer les limites de position
const calculateBoundaries = (x: number, y: number) => {
  if (!toolbarRef.value) return { x, y }

  // Obtenir les dimensions réelles de la barre
  const rect = toolbarRef.value.getBoundingClientRect()
  const margin = 20 // Marge de sécurité

  // Calculer les limites en s'assurant que la barre reste entièrement visible
  const maxX = Math.max(margin, Math.min(window.innerWidth - rect.width - margin, x))
  const maxY = Math.max(margin, Math.min(window.innerHeight - rect.height - margin, y))

  // Si la barre est près du bord droit et est ou va être étendue,
  // on la décale pour qu'elle reste entièrement visible
  const isExpanded = settingsStore.settings.expanded || settingsStore.settings.isPinned
  if (isExpanded && maxX + rect.width > window.innerWidth - margin) {
    return {
      x: window.innerWidth - rect.width - margin,
      y: maxY
    }
  }

  return { x: maxX, y: maxY }
}

// Configuration du drag and drop
const position = ref({
  x: settingsStore.settings.position.x || window.innerWidth - 100,
  y: settingsStore.settings.position.y || 20
})

// Synchronisation avec les settings et l'état expanded
watch([
  () => settingsStore.settings.position,
  () => settingsStore.settings.expanded,
  () => settingsStore.settings.isPinned,
  () => toolglowsStore.activeTools
], ([newPosition]) => {
  if (!isDragging.value && newPosition) {
    try {
      // Attendre que le DOM soit mis à jour
      nextTick(() => {
        const boundedPosition = calculateBoundaries(newPosition.x, newPosition.y)
        if (boundedPosition.x !== position.value.x || boundedPosition.y !== position.value.y) {
          position.value = boundedPosition
        }
      })
    } catch (error) {
      console.error('[ERROR] Failed to update position:', error)
    }
  }
}, { deep: true })

const { isDragging } = useDraggable(toolbarRef, {
  initialValue: position.value,
  onMove: ({ x, y }) => {
    try {
      const boundedPosition = calculateBoundaries(x, y)
      position.value = boundedPosition
    } catch (error) {
      console.error('[ERROR] Failed to update position during drag:', error)
    }
  },
  onEnd: async ({ x, y }) => {
    try {
      const boundedPosition = calculateBoundaries(x, y)
      position.value = boundedPosition

      // Mise à jour des settings avec retry
      const maxRetries = 3
      let retryCount = 0

      while (retryCount < maxRetries) {
        try {
          await settingsStore.updateSettings({
            ...settingsStore.settings,
            position: boundedPosition
          })
          break
        } catch (error) {
          retryCount++
          if (retryCount === maxRetries) {
            console.error('[ERROR] Failed to update settings after retries:', error)
          } else {
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
          }
        }
      }
    } catch (error) {
      console.error('[ERROR] Failed to handle drag end:', error)
    }
  }
})

// Gestionnaire de redimensionnement de la fenêtre avec debounce
const handleResize = useDebounceFn(async () => {
  if (!isDragging.value) {
    try {
      const boundedPosition = calculateBoundaries(position.value.x, position.value.y)
      if (boundedPosition.x !== position.value.x || boundedPosition.y !== position.value.y) {
        position.value = boundedPosition
        await settingsStore.updateSettings({
          ...settingsStore.settings,
          position: boundedPosition
        })
      }
    } catch (error) {
      console.error('[ERROR] Failed to handle resize:', error)
    }
  }
}, 100)

// Écouter les changements de taille de fenêtre
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Constantes pour les tailles
const sizeClasses = {
  'xs': { buttonSize: '2.5rem', fontSize: '1.2rem', emojiSize: '1.5rem' },
  'sm': { buttonSize: '3rem', fontSize: '1.3rem', emojiSize: '1.7rem' },
  'md': { buttonSize: '4rem', fontSize: '1.5rem', emojiSize: '2rem' },
  'lg': { buttonSize: '5rem', fontSize: '1.7rem', emojiSize: '2.3rem' },
  'xl': { buttonSize: '6rem', fontSize: '1.9rem', emojiSize: '2.6rem' }
}

// Computed style qui combine le style du drag et les autres styles
const toolbarStyle = computed(() => {
  const size = sizeClasses[settingsStore.settings.toolbarSize || 'md']

  return {
    position: 'fixed' as const,
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    backgroundColor: settingsStore.settings.toolbarColor || '#ff69b4',
    '--button-size': size.buttonSize,
    '--font-size': size.fontSize,
    '--emoji-size': size.emojiSize,
    zIndex: 2147483647
  }
})

// Gestionnaire du clic sur le bouton principal
const handleMainButtonClick = () => {
  if (!isDragging.value) {
    isExpanded.value = !isExpanded.value
    settingsStore.settings.expanded = isExpanded.value
  }
}

// Si épinglé, toujours expanded
watch(() => settingsStore.settings.isPinned, (isPinned) => {
  if (isPinned) {
    isExpanded.value = true
    settingsStore.settings.expanded = true
  }
})

// Synchronisation avec le store
watch(() => settingsStore.settings.expanded, (expanded) => {
  if (expanded !== isExpanded.value) {
    isExpanded.value = expanded
  }
})

// Gestion du clic en dehors
onClickOutside(toolbarRef, () => {
  if (!settingsStore.settings.isPinned && isExpanded.value) {
    isExpanded.value = false
    settingsStore.settings.expanded = false
  }
})

// Synchronisation avec AutoCopy
watch(() => isVisible.value['autoCopy'], (newValue) => {
  if (autoCopyStore.isActive !== newValue) {
    autoCopyStore.setActive(newValue)
  }
})

watch(() => autoCopyStore.isActive, (newValue) => {
  if (isVisible.value['autoCopy'] !== newValue) {
    isVisible.value['autoCopy'] = newValue
  }
})

// Exclure la barre du mode sombre
useExcludeToolGlowsBar()

onMounted(async () => {
  try {
    await settingsStore.loadSettings()
    isExpanded.value = settingsStore.settings.expanded

    // Applique la position initiale avec les limites
    const boundedPosition = calculateBoundaries(
      settingsStore.settings.position.x || window.innerWidth - 100,
      settingsStore.settings.position.y || 20
    )
    position.value = boundedPosition

    // Met à jour le store si la position a été ajustée
    if (boundedPosition.x !== settingsStore.settings.position.x ||
        boundedPosition.y !== settingsStore.settings.position.y) {
      try {
        await settingsStore.updateSettings({
          ...settingsStore.settings,
          position: boundedPosition
        })
      } catch (error) {
        console.error('[ERROR] Failed to update initial position:', error)
      }
    }

    console.log('[INFO] Initializing tools')
    await toolglowsStore.initTools(initialTools)

    initialTools.forEach(tool => {
      isVisible.value[tool.id] = false
    })

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
</script>

<style scoped>
.toolglows-bar {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  border-radius: 3rem;
  box-shadow: var(--card-shadow);
  user-select: none;
  cursor: move;
  min-width: fit-content;
  padding: 0.5rem;
  touch-action: none;

  &.toolglows-expanded {
    cursor: default;
  }

  &.toolglows-dragging {
    cursor: grabbing !important;
    opacity: 0.95;
  }

  :deep(.p-button) {
    width: var(--button-size) !important;
    height: var(--button-size) !important;
    font-size: var(--font-size);
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
  }

  :deep(.p-button-icon) {
    font-size: var(--font-size);
    margin: 0 !important;
    width: auto !important;
    height: auto !important;
  }
}

.toolglows-loading {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 8px;
  z-index: 2147483647;
}

.toolglows-tool-emoji {
  font-size: var(--emoji-size);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.toolglows-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
  }
}

.toolglows-settings-content {
  padding: 1rem;
}

.toolglows-tools-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.toolglows-tool-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.toolglows-tool-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.toolglows-tool-name {
  color: var(--text-color);
  font-size: 0.9rem;
}

.toolglows-setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  flex-wrap: wrap;
}

.toolglows-settings-dialog {
  :deep(.p-dialog-content) {
    padding: 1.5rem;
  }
}

.toolglows-tools-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex-wrap: wrap;
  align-content: flex-start;
  max-height: calc(100vh - 5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.25rem;
}

@media (max-width: 640px) {
  .toolglows-bar {
    max-width: calc(100vw - 2rem);
  }

  .toolglows-tools-container {
    max-width: calc(100vw - 6rem);
  }
}
</style>
