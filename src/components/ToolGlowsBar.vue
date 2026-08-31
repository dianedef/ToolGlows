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
    @pointerdown.capture="startToolbarPointer"
    @pointermove.capture="moveToolbarPointer"
    @pointerup.capture="finishToolbarPointer"
    @pointercancel.capture="finishToolbarPointer"
    @click.capture="suppressDraggedClick"
    @contextmenu.capture="openToolSettings"
  >
    <Toast position="bottom-right" />
    <!-- Bouton principal -->
    <Button
      class="toolglows-main-button p-button-rounded"
      :class="{ dragging: isDragging }"
      :icon="isExpanded ? 'pi pi-times' : 'pi pi-bars'"
      text
      raised
      aria-label="ToolGlows"
      data-toolglows-main
      v-tooltip.bottom="'ToolGlows'"
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
        data-toolglows-settings
        v-tooltip.top="'Paramètres'"
        @click="showSettings = !showSettings"
      >
        <span class="toolglows-tool-emoji">⚙️</span>
      </Button>

      <!-- Tous les outils restent visibles ; leur apparence reflète leur activation. -->
      <template
        v-for="tool in toolglowsStore.tools"
        :key="tool.id"
      >
        <Button
          class="toolglows-tool-button p-button-rounded p-button-text"
          :class="{
            'toolglows-tool-button-active': isToolEnabled(tool.id),
            'toolglows-tool-button-inactive': !isToolEnabled(tool.id)
          }"
          :aria-label="tool.name"
          :aria-pressed="tool.interaction === 'command' ? undefined : isToolEnabled(tool.id)"
          :title="toolButtonTitle(tool)"
          :data-tool-id="tool.id"
          v-tooltip.top="tool.name"
          @click="toggleToolActivation(tool.id)"
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
        v-if="toolglowsStore.activeTools.includes(tool.id) || isVisible[tool.id]"
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
  <ToolGlowsDialog
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
      <label class="toolglows-setting-item toolglows-clickable-setting">
        <Checkbox
          :model-value="isInterfaceDark"
          :binary="true"
          input-id="interfaceTheme"
          @update:model-value="toggleInterfaceTheme"
        />
        <span>Mode sombre de ToolGlows</span>
      </label>
      <label class="toolglows-setting-item toolglows-clickable-setting">
        <Checkbox
          v-model="settingsStore.settings.isPinned"
          :binary="true"
          input-id="pinBar"
        />
        <span>Épingler la barre d'outils</span>
      </label>

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
      <h3>🛠️ Outils chargés dans la page</h3>
      <div class="toolglows-tools-grid">
        <label
          v-for="tool in toolglowsStore.tools"
          :key="tool.id"
          class="toolglows-tool-item toolglows-clickable-setting"
        >
          <Checkbox
            :model-value="toolglowsStore.activeTools.includes(tool.id)"
            :binary="true"
            :input-id="'tool-' + tool.id"
            @update:model-value="() => toolglowsStore.toggleTool(tool.id)"
          />
          <div class="toolglows-tool-header">
            <span class="toolglows-tool-emoji">{{ tool.emoji }}</span>
            <span class="toolglows-tool-name">{{ tool.name }}</span>
          </div>
        </label>
      </div>
    </div>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, markRaw, onUnmounted, computed, watch, nextTick } from 'vue'
import type { Tool } from '@/types/tools'
import { useSettingsStore } from '@/stores/settings'
import { useToolGlowsStore } from '@/stores/toolglows'
import { useInstantOCRStore } from '@/stores/instantOCR'
import { useWordCounterStore } from '@/stores/wordCounter'
import { useAutoCopyStore } from '@/stores/autoCopy'
import { useDarkModeStore } from '@/stores/darkMode'
import { useLinksExplorerStore } from '@/stores/linksExplorer'
import { useSocialAnalysisStore } from '@/stores/socialAnalysis'
import { useReloadAllTabsStore } from '@/stores/reloadAllTabs'
import { useHideElementStore } from '@/stores/hideElement'
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
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import { onClickOutside } from '@vueuse/core'
import Toast from 'primevue/toast'
import { useExcludeToolGlowsBar } from '@/composables/excludeToolGlowsBar'
import ThemeSwatch from './ThemeSwatch.vue'
import Tooltip from 'primevue/tooltip'

const vTooltip = Tooltip
import { useDebounceFn } from '@vueuse/core'

// États locaux
const isExpanded = ref(false)
const showSettings = ref(false)
const isLoading = ref(true)
const isVisible = ref<Record<string, boolean>>({})
const toolbarRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const settingsLoaded = ref(false)

// Injection des stores avec typage
const settingsStore = inject('settingsStore') as ReturnType<typeof useSettingsStore>
const toolglowsStore = inject('toolglowsStore') as ReturnType<typeof useToolGlowsStore>
const ocrStore = inject('ocrStore') as ReturnType<typeof useInstantOCRStore>
const wordCounterStore = inject('wordCounterStore') as ReturnType<typeof useWordCounterStore>
const autoCopyStore = useAutoCopyStore()
const darkModeStore = useDarkModeStore()
const linksExplorerStore = useLinksExplorerStore()
const socialAnalysisStore = useSocialAnalysisStore()
const reloadAllTabsStore = useReloadAllTabsStore()
const hideElementStore = useHideElementStore()

const isInterfaceDark = computed(() => settingsStore.settings.interfaceTheme === 'dark')

const toggleInterfaceTheme = () => {
  void settingsStore.updateSettings({
    interfaceTheme: isInterfaceDark.value ? 'light' : 'dark'
  })
}

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
    category: 'reading',
    interaction: 'panel'
  },
  {
    id: 'ocr',
    name: 'OCR instantané',
    component: markRaw(InstantOCRControl),
    icon: 'pi pi-camera',
    emoji: '📸',
    category: 'reading', interaction: 'panel'
  },
  {
    id: 'darkMode',
    name: 'Mode sombre',
    component: markRaw(DarkModeControl),
    icon: 'pi pi-moon',
    emoji: '🌙',
    category: 'appearance', interaction: 'toggle'
  },
  {
    id: 'speedBrowsing',
    name: 'Navigation rapide',
    component: markRaw(SpeedBrowsingControl),
    icon: 'pi pi-forward',
    emoji: '⚡',
    category: 'navigation', interaction: 'panel'
  },
  {
    id: 'infiniteScroll',
    name: 'Défilement infini',
    component: markRaw(InfiniteScrollControl),
    icon: 'pi pi-arrow-down',
    emoji: '♾️',
    category: 'navigation', interaction: 'panel'
  },
  {
    id: 'feedEradicator',
    name: 'Éradicateur de flux',
    component: markRaw(FeedEradicatorControl),
    icon: 'pi pi-ban',
    emoji: '🚫',
    category: 'social', interaction: 'panel'
  },
  {
    id: 'readerMode',
    name: 'Mode lecture',
    component: markRaw(ReaderModeControl),
    icon: 'pi pi-book',
    emoji: '📖',
    category: 'reading', interaction: 'panel'
  },
  {
    id: 'searchJumper',
    name: 'Recherche rapide',
    component: markRaw(SearchJumperUI),
    icon: 'pi pi-search',
    emoji: '🔍',
    category: 'navigation', interaction: 'panel'
  },
  {
    id: 'dragOpen',
    name: 'Glisser-déposer',
    component: markRaw(DragOpenControl),
    icon: 'pi pi-arrows-alt',
    emoji: '🔄',
    category: 'navigation', interaction: 'panel'
  },
  {
    id: 'instagramSaved',
    name: 'Bibliothèque Instagram',
    component: markRaw(InstagramSavedLibrary),
    icon: 'pi pi-instagram',
    emoji: '📸',
    category: 'social', interaction: 'panel'
  },
  {
    id: 'richCopy',
    name: 'Copie enrichie',
    component: markRaw(RichCopyControl),
    icon: 'pi pi-copy',
    emoji: '📋',
    category: 'reading', interaction: 'panel'
  },
  {
    id: 'betterGmail',
    name: 'Gmail amélioré',
    component: markRaw(BetterGmailControl),
    icon: 'pi pi-envelope',
    emoji: '📧',
    category: 'social', interaction: 'panel'
  },
  {
    id: 'quickActions',
    name: 'Actions rapides',
    component: markRaw(QuickActionsControl),
    icon: 'pi pi-bolt',
    emoji: '⚡',
    category: 'navigation', interaction: 'panel'
  },
  {
    id: 'autoCopy',
    name: 'Copie automatique',
    component: markRaw(AutoCopyControl),
    icon: 'pi pi-copy',
    emoji: '✂️',
    category: 'reading', interaction: 'toggle'
  },
  {
    id: 'linksExplorer',
    name: 'Explorateur de liens',
    component: markRaw(LinksExplorerControl),
    icon: 'pi pi-link',
    emoji: '🔗',
    category: 'navigation', interaction: 'command'
  },
  {
    id: 'socialAnalysis',
    name: 'Analyse Sociale',
    component: markRaw(SocialAnalysisControl),
    icon: 'pi pi-users',
    emoji: '👥',
    category: 'social', interaction: 'command'
  },
  {
    id: 'reloadAllTabs',
    name: 'Recharger les onglets',
    component: markRaw(ReloadAllTabsControl),
    icon: 'pi pi-refresh',
    emoji: '🔄',
    category: 'navigation', interaction: 'command'
  },
  {
    id: 'hideElement',
    name: 'Masquer des éléments',
    component: markRaw(HideElementControl),
    icon: 'pi pi-eye-slash',
    emoji: '👁️',
    category: 'appearance', interaction: 'toggle'
  }
]

// Fonction pour calculer les limites de position
const toolbarSafeMargin = Number.parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue('--tg-size-20').trim() || '20'
) || 20
const toolbarDefaultOffset = Number.parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue('--tg-size-50').trim() || '100'
) || 100

const calculateBoundaries = (x: number, y: number) => {
  if (!toolbarRef.value) return { x, y }

  // Obtenir les dimensions réelles de la barre
  const rect = toolbarRef.value.getBoundingClientRect()
  const margin = toolbarSafeMargin // Marge de sécurité

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
  x: settingsStore.settings.position.x || window.innerWidth - toolbarDefaultOffset,
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

const dragThreshold = 5
let suppressNextClick = false
let pointerState: {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
} | null = null

const persistToolbarPosition = async () => {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      await settingsStore.updateSettings({
        ...settingsStore.settings,
        position: position.value
      })
      return
    } catch (error) {
      retryCount++
      if (retryCount === maxRetries) {
        console.error('[ERROR] Failed to update settings after retries:', error)
      } else {
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
      }
    }
  }
}

const startToolbarPointer = (event: PointerEvent) => {
  if (event.button !== 0) return

  pointerState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: position.value.x,
    originY: position.value.y,
    moved: false
  }
  suppressNextClick = false
}

const moveToolbarPointer = (event: PointerEvent) => {
  if (!pointerState || event.pointerId !== pointerState.pointerId) return

  const deltaX = event.clientX - pointerState.startX
  const deltaY = event.clientY - pointerState.startY
  if (!pointerState.moved && Math.hypot(deltaX, deltaY) < dragThreshold) return

  pointerState.moved = true
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  isDragging.value = true
  position.value = calculateBoundaries(
    pointerState.originX + deltaX,
    pointerState.originY + deltaY
  )
}

const finishToolbarPointer = (event: PointerEvent) => {
  if (!pointerState || event.pointerId !== pointerState.pointerId) return

  suppressNextClick = pointerState.moved
  const shouldPersist = pointerState.moved
  pointerState = null
  isDragging.value = false
  const toolbar = event.currentTarget as HTMLElement
  if (toolbar.hasPointerCapture?.(event.pointerId)) {
    toolbar.releasePointerCapture(event.pointerId)
  }

  if (shouldPersist) void persistToolbarPosition()
}

const suppressDraggedClick = (event: MouseEvent) => {
  if (!suppressNextClick) return
  suppressNextClick = false
  event.preventDefault()
  event.stopImmediatePropagation()
}

const openToolSettings = (event: MouseEvent) => {
  const target = event.target instanceof Element
    ? event.target.closest<HTMLElement>('[data-tool-id], [data-toolglows-main], [data-toolglows-settings]')
    : null
  if (!target) return

  event.preventDefault()
  event.stopPropagation()

  const toolId = target.dataset.toolId
  if (toolId) {
    isVisible.value[toolId] = true
    return
  }

  showSettings.value = true
}

const isToolEnabled = (toolId: string) => {
  if (toolId === 'darkMode') return darkModeStore.isActive
  if (toolId === 'autoCopy') return toolglowsStore.activeTools.includes(toolId)
  if (toolId === 'hideElement') return hideElementStore.settings.isSelectingElement
  const tool = toolglowsStore.tools.find(candidate => candidate.id === toolId)
  if (tool?.interaction === 'panel') return Boolean(isVisible.value[toolId])
  if (tool?.interaction === 'command') return true
  return toolglowsStore.activeTools.includes(toolId)
}

const toolButtonTitle = (tool: Tool) => {
  if (tool.interaction === 'command') return `${tool.name} — exécuter`
  return `${tool.name} — ${isToolEnabled(tool.id) ? 'actif' : 'inactif'}`
}

const syncRegisteredToolState = async (toolId: string, enabled: boolean) => {
  if (toolglowsStore.activeTools.includes(toolId) !== enabled) {
    await toolglowsStore.toggleTool(toolId)
  }
}

watch(
  () => toolglowsStore.activeTools.includes('darkMode'),
  async isRegistered => {
    if (settingsLoaded.value && !isRegistered && darkModeStore.isActive) {
      await darkModeStore.setActive(false)
    }
  }
)

const toggleToolActivation = async (toolId: string) => {
  const tool = toolglowsStore.tools.find(candidate => candidate.id === toolId)
  if (!tool) return

  if (tool.interaction === 'panel') {
    isVisible.value[toolId] = !isVisible.value[toolId]
    return
  }

  if (tool.interaction === 'command') {
    if (toolId === 'reloadAllTabs') await reloadAllTabsStore.reloadAllTabs()
    if (toolId === 'linksExplorer') {
      await linksExplorerStore.exploreLinks()
      isVisible.value[toolId] = true
    }
    if (toolId === 'socialAnalysis') {
      await socialAnalysisStore.analyzeComments()
      isVisible.value[toolId] = true
    }
    return
  }

  const enabled = !isToolEnabled(toolId)

  if (toolId === 'darkMode') {
    await darkModeStore.setActive(enabled)
    await syncRegisteredToolState(toolId, enabled)
    return
  }

  if (toolId === 'hideElement') {
    await syncRegisteredToolState(toolId, enabled)
    hideElementStore.settings.isSelectingElement = enabled
    return
  }

  await toolglowsStore.toggleTool(toolId)
}

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
  'xs': { buttonSize: 'var(--tg-size-toolbar-xs)', fontSize: 'var(--tg-size-tool-font-xs)', emojiSize: 'var(--tg-size-tool-emoji-xs)' },
  'sm': { buttonSize: 'var(--tg-size-toolbar-sm)', fontSize: 'var(--tg-size-tool-font-sm)', emojiSize: 'var(--tg-size-tool-emoji-sm)' },
  'md': { buttonSize: 'var(--tg-size-toolbar-md)', fontSize: 'var(--tg-size-tool-font-md)', emojiSize: 'var(--tg-size-tool-emoji-md)' },
  'lg': { buttonSize: 'var(--tg-size-toolbar-lg)', fontSize: 'var(--tg-size-tool-font-lg)', emojiSize: 'var(--tg-size-tool-emoji-lg)' },
  'xl': { buttonSize: 'var(--tg-size-toolbar-xl)', fontSize: 'var(--tg-size-tool-font-xl)', emojiSize: 'var(--tg-size-tool-emoji-xl)' }
}

// Computed style qui combine le style du drag et les autres styles
const toolbarStyle = computed(() => {
  const size = sizeClasses[settingsStore.settings.toolbarSize || 'md']

  return {
    position: 'fixed' as const,
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    backgroundColor: settingsStore.settings.toolbarColor || 'var(--tg-toolbar-color-default)',
    '--button-size': size.buttonSize,
    '--font-size': size.fontSize,
    '--emoji-size': size.emojiSize,
    zIndex: 'var(--tg-z-extension)'
  }
})

// Gestionnaire du clic sur le bouton principal
const handleMainButtonClick = () => {
  if (suppressNextClick) {
    suppressNextClick = false
    return
  }

  isExpanded.value = !isExpanded.value
  settingsStore.settings.expanded = isExpanded.value
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

watch(isExpanded, (expanded) => {
  if (!expanded && !isDragging.value) {
    nextTick(() => {
      position.value = calculateBoundaries(
        settingsStore.settings.position.x,
        settingsStore.settings.position.y
      )
    })
  }
})

// Gestion du clic en dehors
onClickOutside(toolbarRef, () => {
  if (!settingsStore.settings.isPinned && isExpanded.value) {
    isExpanded.value = false
    settingsStore.settings.expanded = false
  }
}, {
  ignore: ['.p-dialog', '.p-dialog-mask', '.p-tooltip']
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
    await darkModeStore.loadOptions()
    settingsLoaded.value = true
    if (!toolglowsStore.activeTools.includes('darkMode') && darkModeStore.isActive) {
      await darkModeStore.setActive(false)
    }
    isExpanded.value = settingsStore.settings.expanded

    // Applique la position initiale avec les limites
    const boundedPosition = calculateBoundaries(
      settingsStore.settings.position.x || window.innerWidth - toolbarDefaultOffset,
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
  gap: var(--tg-space-4);
  border-radius: var(--tg-radius-floating-shell);
  box-shadow: var(--card-shadow);
  user-select: none;
  cursor: default;
  min-width: fit-content;
  padding: var(--tg-space-2);
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
  bottom: var(--tg-space-5);
  left: var(--tg-space-5);
  padding: var(--tg-space-2);
  background: var(--tg-loading-surface);
  color: var(--tg-action-on);
  border-radius: var(--tg-radius-control);
  z-index: var(--tg-z-extension);
}

.toolglows-tool-emoji {
  font-size: var(--emoji-size);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--tg-full-width);
  height: var(--tg-full-height);
  line-height: 1;
  font-family: "Segoe UI Emoji", "Apple Color Emoji", sans-serif;
  font-style: normal;
  transform: none !important;
}

.toolglows-tool-button {
  transition:
    opacity var(--tg-motion-fast),
    filter var(--tg-motion-fast),
    background-color var(--tg-motion-fast);
}

.toolglows-tool-button-active {
  opacity: 1;
  filter: none;
}

.toolglows-tool-button-inactive {
  opacity: 0.42;
  filter: grayscale(1) saturate(0.2);
}

.toolglows-tool-button-inactive:hover,
.toolglows-tool-button-inactive:focus-visible {
  opacity: 0.68;
}

.toolglows-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--tg-space-4);

  h3 {
    margin: 0;
  }
}

.toolglows-settings-content {
  padding: var(--tg-space-4);
}

.toolglows-tools-grid {
  display: grid;
  gap: var(--tg-space-4);
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.toolglows-tool-item {
  display: flex;
  align-items: center;
  gap: var(--tg-space-3);
  padding: var(--tg-space-2);
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.toolglows-tool-header {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
  flex: 1;
}

.toolglows-tool-name {
  color: var(--text-color);
  font-size: var(--tg-text-base);
}

.toolglows-setting-item {
  display: flex;
  align-items: center;
  gap: var(--tg-space-3);
  padding: var(--tg-space-2);
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  flex-wrap: wrap;
}

.toolglows-main-button.p-button {
  cursor: grab !important;
  touch-action: none;
  overflow: hidden;
  border-radius: 50% !important;
}

.toolglows-clickable-setting {
  cursor: pointer;
}

.toolglows-clickable-setting:hover {
  background: var(--surface-hover);
}

.toolglows-settings-dialog {
  :deep(.p-dialog-content) {
    padding: var(--tg-space-5);
  }
}

.toolglows-tools-container {
  display: flex;
  flex-direction: row;
  gap: var(--tg-space-4);
  flex-wrap: wrap;
  align-content: flex-start;
  max-height: calc(100vh - 5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: var(--tg-space-1);
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
