<template>
  <Toast
    position="bottom-right"
    class="toolglows-toast"
    data-toolglows-ui="true"
  />
  <Toast
    group="auto-copy"
    position="bottom-right"
    class="toolglows-toast toolglows-auto-copy-toast"
    data-toolglows-ui="true"
  />
  <div
    v-if="!isLoading"
    ref="toolbarRef"
    class="toolglows-bar"
    :style="toolbarStyle"
    :class="{
      'toolglows-expanded': isExpanded || settingsStore.settings.isPinned,
      'toolglows-dragging': isDragging,
      'toolglows-toolbar-wheel-mode': isToolbarResizeMode
    }"
    @pointerdown.capture="startToolbarPointer"
    @pointermove.capture="moveToolbarPointer"
    @pointerup.capture="finishToolbarPointer"
    @pointercancel.capture="finishToolbarPointer"
    @click.capture="suppressDraggedClick"
    @contextmenu.capture="openToolSettings"
  >
    <!-- Bouton principal -->
    <Button
      v-tooltip.bottom="'ToolGlows'"
      class="toolglows-main-button p-button-rounded"
      :class="{ dragging: isDragging }"
      :icon="isExpanded ? 'pi pi-times' : 'pi pi-bars'"
      text
      raised
      aria-label="ToolGlows"
      data-toolglows-main
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
        v-tooltip.top="'Paramètres'"
        class="p-button-rounded p-button-text"
        severity="secondary"
        aria-label="Paramètres"
        data-toolglows-settings
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
          v-tooltip.top="tool.name"
          class="toolglows-tool-button p-button-rounded p-button-text"
          :class="{
            'toolglows-tool-button-active': isToolEnabled(tool.id),
            'toolglows-tool-button-inactive': !isToolEnabled(tool.id)
          }"
          :aria-label="tool.name"
          :aria-pressed="tool.interaction === 'command' ? undefined : isToolEnabled(tool.id)"
          :title="toolButtonTitle(tool)"
          :data-tool-id="tool.id"
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
    class="toolglows-settings-dialog"
    append-to="body"
    @hide="closeSettings"
  >
    <div class="toolglows-settings-content toolglows-settings-stack">
      <section class="toolglows-settings-section">
        <div class="toolglows-settings-section-header">
          <div>
            <h3>Général</h3>
            <p>Apparence et comportement de la barre d’outils.</p>
          </div>
          <ThemeSwatch />
        </div>

        <label class="toolglows-settings-row toolglows-clickable-setting">
          <span>Mode sombre de ToolGlows</span>
          <Checkbox
            :model-value="isInterfaceDark"
            :binary="true"
            input-id="interfaceTheme"
            @update:model-value="toggleInterfaceTheme"
          />
        </label>
        <label class="toolglows-settings-row toolglows-clickable-setting">
          <span>Épingler la barre d'outils</span>
          <Checkbox
            v-model="settingsStore.settings.isPinned"
            :binary="true"
            input-id="pinBar"
          />
        </label>
        <div class="toolglows-settings-row">
          <label for="toolbarSize">Taille de la barre d'outils</label>
          <div class="toolglows-toolbar-size-control">
            <Button
              :label="isToolbarResizeMode ? 'Désactiver le réglage molette' : 'Ajuster la taille avec la molette'"
              :severity="isToolbarResizeMode ? 'danger' : 'secondary'"
              :aria-pressed="isToolbarResizeMode"
              data-toolglows-wheel-size
              class="toolglows-toolbar-size-button"
              @click="toggleToolbarWheelSizeMode"
            />
            <span
              class="toolglows-toolbar-size-indicator"
              aria-live="polite"
            >
              Taille actuelle : {{ toolbarSizeLabel }}
            </span>
          </div>
        </div>
      </section>

      <section class="toolglows-settings-section">
        <div class="toolglows-settings-section-header">
          <div>
            <h3>Page actuelle</h3>
            <p>Réglages et éléments enregistrés uniquement pour ce site.</p>
          </div>
        </div>
        <div class="toolglows-settings-row toolglows-settings-row-danger">
          <div>
            <strong>Éléments masqués</strong>
            <small>{{ hiddenElementCount }} élément(s) enregistré(s)</small>
          </div>
          <Button
            label="Tout restaurer"
            icon="pi pi-refresh"
            severity="danger"
            text
            :disabled="hiddenElementCount === 0"
            @click="hideElementStore.resetHiddenElementsForCurrentSite"
          />
        </div>
      </section>

      <section class="toolglows-settings-section">
        <div class="toolglows-settings-section-header">
          <div>
            <h3>Outils actifs</h3>
            <p>Choisissez les outils affichés dans la barre.</p>
          </div>
        </div>
        <div class="toolglows-tools-grid">
          <label
            v-for="tool in toolglowsStore.tools"
            :key="tool.id"
            class="toolglows-tool-item toolglows-clickable-setting"
          >
            <span class="toolglows-tool-header">
              <span class="toolglows-tool-emoji">{{ tool.emoji }}</span>
              <span class="toolglows-tool-name">{{ tool.name }}</span>
            </span>
            <Checkbox
              :model-value="toolglowsStore.activeTools.includes(tool.id)"
              :binary="true"
              :input-id="'tool-' + tool.id"
              @update:model-value="() => toolglowsStore.toggleTool(tool.id)"
            />
          </label>
        </div>
      </section>
    </div>
  </ToolGlowsDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, markRaw, onUnmounted, computed, watch, nextTick, onBeforeUnmount } from 'vue'
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
import { useReaderModeStore } from '@/stores/readerMode'
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
import { onClickOutside } from '@vueuse/core'
import Toast from 'primevue/toast'
import { useExcludeToolGlowsBar } from '@/composables/excludeToolGlowsBar'
import ThemeSwatch from './ThemeSwatch.vue'
import Tooltip from 'primevue/tooltip'
import { TOOLBAR_SIZES, type ToolbarSize } from '@/utils/toolbarSize'

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
const isToolbarResizeMode = ref(false)
const toolbarSizeRestoreTarget = ref<ToolbarSize>('md')

const toolbarSizeOrder = TOOLBAR_SIZES

const toolbarSizeLabels: Record<ToolbarSize, string> = {
  'xxs': 'Microscopique',
  'xxs-plus': 'Microscopique +',
  'xs': 'Très petite',
  'xs-plus': 'Très petite +',
  'xs-plus-mid': 'Très petite ++',
  'sm': 'Petite',
  'sm-plus': 'Petite +',
  'sm-plus-mid': 'Petite ++',
  'md': 'Moyenne',
  'md-mid': 'Moyenne intermédiaire',
  'md-plus': 'Moyenne +',
  'md-plus-mid': 'Moyenne ++',
  'lg': 'Grande',
  'lg-mid': 'Grande intermédiaire',
  'lg-plus': 'Grande +',
  'lg-plus-mid': 'Grande ++',
  'xl': 'Très grande',
  'xl-mid': 'Très grande +',
  'xxl': 'Immense'
}

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
const readerModeStore = useReaderModeStore()

const isInterfaceDark = computed(() => settingsStore.settings.interfaceTheme === 'dark')
const hiddenElementCount = computed(() => hideElementStore.settings.hiddenElements.filter(
  element => element.domain === window.location.hostname
).length)

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
const toolbarSafeMargin = 0
const toolbarDefaultOffset = Number.parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue('--tg-size-50').trim() || '100'
) || 100

const getInterfaceScale = () => {
  const scale = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--tg-interface-scale').trim()
  )
  return Number.isFinite(scale) && scale > 0 ? scale : 1
}

const calculateBoundaries = (x: number, y: number) => {
  if (!toolbarRef.value) return { x, y }

  // Obtenir les dimensions réelles de la barre
  const rect = toolbarRef.value.getBoundingClientRect()
  const interfaceScale = getInterfaceScale()
  const margin = toolbarSafeMargin // Marge de sécurité

  // Edge applique `zoom` aux dimensions mais aussi à `left` / `top`. Les
  // limites du viewport doivent donc être reconverties en coordonnées CSS.
  const minPosition = margin / interfaceScale
  const maxPositionX = (window.innerWidth - rect.width - margin) / interfaceScale
  const maxPositionY = (window.innerHeight - rect.height - margin) / interfaceScale
  const maxX = Math.max(minPosition, Math.min(maxPositionX, x))
  const maxY = Math.max(minPosition, Math.min(maxPositionY, y))

  // Si la barre est près du bord droit et est ou va être étendue,
  // on la décale pour qu'elle reste entièrement visible
  const isExpanded = settingsStore.settings.expanded || settingsStore.settings.isPinned
  if (isExpanded && maxX * interfaceScale + rect.width > window.innerWidth - margin) {
    return {
      x: maxPositionX,
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
  () => settingsStore.settings.toolbarSize,
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
  captureTarget: HTMLElement
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

  // Capture immediately so the drag keeps receiving events even when the
  // pointer leaves the icon before crossing the movement threshold.
  const captureTarget = event.target instanceof HTMLElement
    ? event.target
    : event.currentTarget as HTMLElement
  captureTarget.setPointerCapture?.(event.pointerId)

  pointerState = {
    pointerId: event.pointerId,
    captureTarget,
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
  isDragging.value = true
  const interfaceScale = getInterfaceScale()
  position.value = calculateBoundaries(
    pointerState.originX + deltaX / interfaceScale,
    pointerState.originY + deltaY / interfaceScale
  )
}

const finishToolbarPointer = (event: PointerEvent) => {
  if (!pointerState || event.pointerId !== pointerState.pointerId) return

  suppressNextClick = pointerState.moved
  const shouldPersist = pointerState.moved
  const captureTarget = pointerState.captureTarget
  pointerState = null
  isDragging.value = false
  if (captureTarget.hasPointerCapture?.(event.pointerId)) {
    captureTarget.releasePointerCapture(event.pointerId)
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
  if (toolId === 'readerMode') return readerModeStore.isActive || Boolean(isVisible.value[toolId])
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
    if (enabled) {
      await syncRegisteredToolState(toolId, true)
      hideElementStore.settings.isSelectingElement = true
    } else {
      hideElementStore.settings.isSelectingElement = false
      await syncRegisteredToolState(toolId, false)
    }
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
  'xxs': '--tg-scale-toolbar-xxs',
  'xxs-plus': '--tg-scale-toolbar-xxs-plus',
  'xs': '--tg-scale-toolbar-xs',
  'xs-plus': '--tg-scale-toolbar-xs-plus',
  'xs-plus-mid': '--tg-scale-toolbar-xs-plus-mid',
  'sm': '--tg-scale-toolbar-sm',
  'sm-plus': '--tg-scale-toolbar-sm-plus',
  'sm-plus-mid': '--tg-scale-toolbar-sm-plus-mid',
  'md': '--tg-scale-toolbar-md',
  'md-mid': '--tg-scale-toolbar-md-mid',
  'md-plus': '--tg-scale-toolbar-md-plus',
  'md-plus-mid': '--tg-scale-toolbar-md-plus-mid',
  'lg': '--tg-scale-toolbar-lg',
  'lg-mid': '--tg-scale-toolbar-lg-mid',
  'lg-plus': '--tg-scale-toolbar-lg-plus',
  'lg-plus-mid': '--tg-scale-toolbar-lg-plus-mid',
  'xl': '--tg-scale-toolbar-xl',
  'xl-mid': '--tg-scale-toolbar-xl-mid',
  'xxl': '--tg-scale-toolbar-xxl'
}

watch(
  () => settingsStore.settings.toolbarSize,
  size => {
    const tokenOwner = document.getElementById('toolglows-root') ?? document.documentElement
    const resolvedScale = getComputedStyle(tokenOwner)
      .getPropertyValue(sizeClasses[size || 'md'])
      .trim()

    document.documentElement.style.setProperty('--tg-interface-scale', resolvedScale || '1')
  },
  { immediate: true }
)

// Computed style qui combine le style du drag et les autres styles
const toolbarStyle = computed(() => {
  return {
    position: 'fixed' as const,
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    backgroundColor: settingsStore.settings.toolbarColor || 'var(--tg-toolbar-color-default)',
    '--button-size': 'var(--tg-size-toolbar-md)',
    '--font-size': 'var(--tg-size-tool-font-md)',
    '--emoji-size': 'var(--tg-size-tool-emoji-md)',
    zoom: 'var(--tg-interface-scale)',
    zIndex: 'var(--tg-z-extension)'
  }
})

// Gestionnaire du clic sur le bouton principal
const handleMainButtonClick = () => {
  if (isToolbarResizeMode.value) {
    exitToolbarWheelSizeMode(false)
    return
  }

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
  if (!hideElementStore.settings.isSelectingElement && !settingsStore.settings.isPinned && isExpanded.value) {
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
    await hideElementStore.loadSettings()
    hideElementStore.setupMutationObserver()
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
  exitToolbarWheelSizeMode(false)
  showSettings.value = false
}

const toolbarSizeLabel = computed(() => toolbarSizeLabels[settingsStore.settings.toolbarSize || 'md'])

const toggleToolbarWheelSizeMode = () => {
  if (isToolbarResizeMode.value) {
    exitToolbarWheelSizeMode(false)
    return
  }

  toolbarSizeRestoreTarget.value = settingsStore.settings.toolbarSize || 'md'
  isToolbarResizeMode.value = true
}

const exitToolbarWheelSizeMode = (restoreToInitial: boolean) => {
  if (!isToolbarResizeMode.value) return

  if (restoreToInitial && toolbarSizeRestoreTarget.value !== settingsStore.settings.toolbarSize) {
    const restoredSize = toolbarSizeRestoreTarget.value
    settingsStore.settings.toolbarSize = restoredSize
    void settingsStore.updateSettings({
      ...settingsStore.settings,
      toolbarSize: restoredSize
    })
  }

  isToolbarResizeMode.value = false
}

const handleToolbarWheel = async (event: WheelEvent) => {
  if (!isToolbarResizeMode.value) return

  event.preventDefault()
  if (event.deltaY === 0) return

  const currentSize = settingsStore.settings.toolbarSize || 'md'
  const currentIndex = toolbarSizeOrder.indexOf(currentSize as ToolbarSize)
  if (currentIndex === -1) return

  const nextIndex = currentIndex + (event.deltaY > 0 ? -1 : 1)
  if (nextIndex < 0 || nextIndex >= toolbarSizeOrder.length) return

  const nextSize = toolbarSizeOrder[nextIndex]
  settingsStore.settings.toolbarSize = nextSize
  await settingsStore.updateSettings({
    ...settingsStore.settings,
    toolbarSize: nextSize
  })
}

const handleToolbarResizeModeKey = (event: KeyboardEvent) => {
  if (!isToolbarResizeMode.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    exitToolbarWheelSizeMode(true)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    exitToolbarWheelSizeMode(false)
  }
}

watch(isToolbarResizeMode, (isActive) => {
  if (isActive) {
    window.addEventListener('wheel', handleToolbarWheel, { passive: false })
    window.addEventListener('keydown', handleToolbarResizeModeKey)
    return
  }

  window.removeEventListener('wheel', handleToolbarWheel)
  window.removeEventListener('keydown', handleToolbarResizeModeKey)
}, { immediate: true })

watch(showSettings, (isOpen) => {
  if (!isOpen) {
    exitToolbarWheelSizeMode(false)
  }
})

onUnmounted(() => {
  hideElementStore.teardown()
  document.documentElement.style.removeProperty('--tg-interface-scale')
})

onBeforeUnmount(() => {
  window.removeEventListener('wheel', handleToolbarWheel)
  window.removeEventListener('keydown', handleToolbarResizeModeKey)
})
</script>

<style scoped>
.toolglows-bar {
  display: flex;
  flex-direction: row;
  gap: 0;
  border-radius: var(--tg-radius-floating-shell);
  box-shadow: var(--card-shadow);
  user-select: none;
  cursor: default;
  min-width: fit-content;
  padding: var(--tg-space-2) !important;
  touch-action: none;

  &:not(.toolglows-expanded) {
    border-radius: var(--tg-radius-round);
  }

  &.toolglows-expanded {
    cursor: default;
  }

  &.toolglows-dragging {
    cursor: grabbing !important;
    opacity: 0.95;
  }

  &.toolglows-toolbar-wheel-mode {
    outline: var(--tg-element-outline-width) solid var(--tg-action);
    outline-offset: calc(-1 * var(--tg-space-1));
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
  line-height: var(--tg-line-height-tight);
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

.toolglows-settings-content {
  padding: 0;
}

.toolglows-tools-grid {
  display: grid;
  gap: var(--tg-space-2);
  grid-template-columns: repeat(auto-fill, minmax(var(--tg-size-200), 1fr));
}

.toolglows-tool-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-3);
  padding: var(--tg-space-3);
  background: var(--tg-surface-raised);
  border: var(--tg-border-width-control) solid var(--tg-border-default);
  border-radius: var(--tg-radius-control);
  transition: background var(--tg-motion-fast), border-color var(--tg-motion-fast);
}

.toolglows-tool-header {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
  flex: 1;
}

.toolglows-tool-name {
  color: var(--tg-text-primary);
  font-size: var(--tg-text-base);
}

.toolglows-settings-select {
  min-width: var(--tg-size-field-inline);
}

.toolglows-toolbar-size-control {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--tg-space-2);
}

.toolglows-toolbar-size-button {
  width: fit-content;
}

.toolglows-toolbar-size-indicator {
  color: var(--tg-text-secondary);
  font-size: var(--tg-text-sm);
}

.toolglows-main-button.p-button {
  cursor: grab !important;
  touch-action: none;
  overflow: hidden;
  border-radius: var(--tg-radius-full) !important;
}

.toolglows-clickable-setting {
  cursor: pointer;
}

.toolglows-clickable-setting:hover {
  background: var(--tg-interaction-hover);
}

.toolglows-clickable-setting:has(.p-checkbox-input:focus-visible) {
  outline: var(--tg-element-outline-width) solid var(--tg-action);
  outline-offset: var(--tg-space-1);
}

.toolglows-settings-dialog {
  :deep(.p-dialog-content) {
    padding: var(--tg-space-4);
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
  max-width: calc(100vw - var(--tg-viewport-inline-gutter) - var(--tg-size-main-control));
}

.toolglows-bar {
  max-width: calc(100vw - var(--tg-viewport-inline-gutter));
}
</style>
