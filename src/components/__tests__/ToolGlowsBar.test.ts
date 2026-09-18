/* @vitest-environment jsdom */
import { nextTick, reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ToolGlowsBar from '../ToolGlowsBar.vue'
import { type ToolbarSize } from '@/utils/toolbarSize'
import {
  AURORA_TOOLBAR_FOREGROUNDS,
  AURORA_TOOLBAR_SURFACES
} from '@/stores/darkModePalette'
import { getContrastRatio, TEXT_CONTRAST_MINIMUM } from '@/utils/colorContrast'

const normalizeCssColor = (color: string) => {
  const probe = document.createElement('span')
  probe.style.color = color
  return probe.style.color
}

const outsideHandler = ref<(() => void) | null>(null)
const outsideOptions = ref<Record<string, unknown> | null>(null)

vi.mock('@vueuse/core', () => ({
  useDebounceFn: <T extends (...args: never[]) => unknown>(handler: T) => handler,
  onClickOutside: (
    _target: unknown,
    handler: () => void,
    options: Record<string, unknown>
  ) => {
    outsideHandler.value = handler
    outsideOptions.value = options
  }
}))

vi.mock('@/stores/autoCopy', () => ({
  useAutoCopyStore: () => ({
    isActive: false,
    setActive: vi.fn()
  })
}))

const darkModeState = reactive({
  isActive: true,
  options: { palettePreset: 'graphite' as 'graphite' | 'latte' },
  loadOptions: vi.fn().mockResolvedValue(undefined),
  setActive: vi.fn((value: boolean) => {
    darkModeState.isActive = value
  })
})

vi.mock('@/stores/darkMode', () => ({
  useDarkModeStore: () => darkModeState
}))

const actionStores = {
  linksExplorer: { exploreLinks: vi.fn().mockResolvedValue(undefined) },
  socialAnalysis: { analyzeComments: vi.fn().mockResolvedValue(undefined) },
  reloadAllTabs: { reloadAllTabs: vi.fn().mockResolvedValue(undefined) },
  hideElement: reactive({
    settings: { isSelectingElement: false, hiddenElements: [] as Array<{ domain: string }> },
    loadSettings: vi.fn().mockResolvedValue(undefined),
    setupMutationObserver: vi.fn(),
    resetHiddenElementsForCurrentSite: vi.fn().mockResolvedValue(undefined),
    teardown: vi.fn()
  })
}

vi.mock('@/stores/linksExplorer', () => ({ useLinksExplorerStore: () => actionStores.linksExplorer }))
vi.mock('@/stores/socialAnalysis', () => ({ useSocialAnalysisStore: () => actionStores.socialAnalysis }))
vi.mock('@/stores/reloadAllTabs', () => ({ useReloadAllTabsStore: () => actionStores.reloadAllTabs }))
vi.mock('@/stores/hideElement', () => ({ useHideElementStore: () => actionStores.hideElement }))
vi.mock('@/stores/readerMode', () => ({
  useReaderModeStore: () => ({ isActive: false })
}))

vi.mock('@/stores/settings', () => ({ useSettingsStore: vi.fn() }))
vi.mock('@/stores/toolglows', () => ({ useToolGlowsStore: vi.fn() }))
vi.mock('@/stores/wordCounter', () => ({ useWordCounterStore: vi.fn() }))

const { toolComponentStub, asyncToolModule } = vi.hoisted(() => {
  const stub = { template: '<div />' }
  return {
    toolComponentStub: stub,
    asyncToolModule: () => ({
      default: stub,
      __isTeleport: false,
      __isKeepAlive: false,
      __isSuspense: false
    })
  }
})
vi.mock('../WordCounterPopup.vue', asyncToolModule)
vi.mock('../DarkModeControl.vue', asyncToolModule)
vi.mock('../SpeedBrowsingControl.vue', asyncToolModule)
vi.mock('../InfiniteScrollControl.vue', asyncToolModule)
vi.mock('../FeedEradicatorControl.vue', asyncToolModule)
vi.mock('../ReaderModeControl.vue', asyncToolModule)
vi.mock('../SearchJumperUI.vue', asyncToolModule)
vi.mock('../DragOpenControl.vue', asyncToolModule)
vi.mock('../InstagramSavedLibrary.vue', asyncToolModule)
vi.mock('../RichCopyControl.vue', asyncToolModule)
vi.mock('../BetterGmailControl.vue', asyncToolModule)
vi.mock('../QuickActionsControl.vue', asyncToolModule)
vi.mock('../AutoCopyControl.vue', asyncToolModule)
vi.mock('../LinksExplorerControl.vue', asyncToolModule)
vi.mock('../SocialAnalysisControl.vue', asyncToolModule)
vi.mock('../ReloadAllTabsControl.vue', asyncToolModule)
vi.mock('../HideElementControl.vue', asyncToolModule)

vi.mock('@/composables/excludeToolGlowsBar', () => ({
  useExcludeToolGlowsBar: vi.fn()
}))

function createSettings(pinned = false) {
  return reactive({
    settings: {
      expanded: pinned,
      position: { x: 200, y: 20 },
      activeTools: [],
      isPinned: pinned,
      toolbarVisible: true,
      interfaceTheme: 'light' as 'light' | 'dark',
      toolbarColor: 'var(--tg-toolbar-color-default)',
      toolbarSize: 'md' as ToolbarSize,
      components: {}
    },
    loadSettings: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue(undefined)
  })
}

async function mountToolbar(pinned = false) {
  const settingsStore = createSettings(pinned)
  const activeTools = reactive<string[]>(['darkMode'])
  const toggleTool = vi.fn(async (toolId: string) => {
    const index = activeTools.indexOf(toolId)
    if (index >= 0) activeTools.splice(index, 1)
    else activeTools.push(toolId)
  })
  const toolglowsStore = reactive({
    tools: [] as Array<{ id: string }>,
    activeTools,
    toggleTool,
    initTools: vi.fn(async (tools: Array<{ id: string }>) => {
      toolglowsStore.tools.splice(0, toolglowsStore.tools.length, ...tools)
    })
  })

  const wrapper = mount(ToolGlowsBar, {
    global: {
      provide: {
        settingsStore,
        toolglowsStore,
        wordCounterStore: {}
      },
      directives: { tooltip: {} },
      stubs: {
        AsyncComponentWrapper: toolComponentStub,
        Button: { template: '<button v-bind="$attrs"><slot /></button>' },
        Checkbox: true,
        Dialog: {
          props: ['visible'],
          template: '<section v-if="visible"><slot /></section>'
        },
        ThemeSwatch: true,
        Toast: true
      }
    }
  })

  await Promise.resolve()
  await flushPromises()
  await nextTick()
  await nextTick()
  return { settingsStore, toolglowsStore, wrapper }
}

async function dispatchPointer(
  element: Element,
  type: string,
  values: { button?: number; pointerId: number; clientX: number; clientY: number }
) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    button: { value: values.button ?? 0 },
    pointerId: { value: values.pointerId },
    clientX: { value: values.clientX },
    clientY: { value: values.clientY }
  })
  element.dispatchEvent(event)
  await nextTick()
}

async function dispatchWheel(element: Element, deltaY: number) {
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY
  })
  window.dispatchEvent(event)
  await nextTick()
}

describe('ToolGlowsBar interaction invariants', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', { storage: {
      local: { get: vi.fn().mockResolvedValue({ 'toolglowsOnboarding.v1.skipAll': true }), set: vi.fn().mockResolvedValue(undefined) },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
    } })
    document.body.innerHTML = `
      <div
        id="toolglows-root"
        style="
          --tg-scale-toolbar-xxs: 0.3;
          --tg-scale-toolbar-xs: 0.4;
          --tg-scale-toolbar-xs-plus: 0.55;
          --tg-scale-toolbar-sm: 0.75;
          --tg-scale-toolbar-sm-plus: 0.875;
          --tg-scale-toolbar-md: 1;
          --tg-scale-toolbar-md-plus: 1.125;
          --tg-scale-toolbar-lg: 1.25;
          --tg-scale-toolbar-lg-plus: 1.375;
          --tg-scale-toolbar-xl: 1.5;
          --tg-scale-toolbar-xxl: 1.75;
        "
      ></div>
    `
    document.documentElement.style.removeProperty('--tg-interface-scale')
    outsideHandler.value = null
    outsideOptions.value = null
    darkModeState.isActive = true
    darkModeState.options.palettePreset = 'graphite'
    darkModeState.setActive.mockClear()
    darkModeState.loadOptions.mockClear()
    actionStores.linksExplorer.exploreLinks.mockClear()
    actionStores.socialAnalysis.analyzeComments.mockClear()
    actionStores.reloadAllTabs.reloadAllTabs.mockClear()
    actionStores.hideElement.settings.isSelectingElement = false
    actionStores.hideElement.loadSettings.mockClear()
    actionStores.hideElement.setupMutationObserver.mockClear()
    actionStores.hideElement.teardown.mockClear()
  })

  it('explains the first cookie action, then toggles the real preference without reopening settings', async () => {
    const stored: Record<string, unknown> = {}
    vi.mocked(chrome.storage.local.get).mockImplementation(async () => ({ ...stored }))
    vi.mocked(chrome.storage.local.set).mockImplementation(async values => { Object.assign(stored, values) })
    const { wrapper, toolglowsStore } = await mountToolbar(true)
    const cookie = wrapper.get('[data-tool-id="cookieConsent"]')
    await cookie.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-tool-introduction]').exists()).toBe(true)
    expect(stored.toolglowsCookieConsent).toBeUndefined()
    await wrapper.get('[data-intro-continue]').trigger('click')
    await flushPromises()
    expect(stored.toolglowsCookieConsent).toEqual({ enabled: true, excludedHosts: [] })
    expect(cookie.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-tool-introduction]').exists()).toBe(false)
    await cookie.trigger('click')
    await flushPromises()
    expect(cookie.attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[data-tool-introduction]').exists()).toBe(false)
    expect(toolglowsStore.toggleTool).not.toHaveBeenCalledWith('cookieConsent')
    wrapper.unmount()
  })

  it('opens cookie settings from the keyboard without enabling acceptance', async () => {
    const { wrapper } = await mountToolbar(true)
    await wrapper.get('[data-tool-id="cookieConsent"]').trigger('keydown', { key: 'F10', shiftKey: true })
    await flushPromises()
    expect(wrapper.get('[data-tool-id="cookieConsent"]').attributes('aria-pressed')).toBe('false')
    expect(chrome.storage.local.set).not.toHaveBeenCalled()
    expect(wrapper.find('[data-tool-introduction]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('uses one round button for both drag and click interaction', async () => {
    const { wrapper } = await mountToolbar()

    expect(wrapper.find('.toolglows-drag-handle').exists()).toBe(false)
    expect(wrapper.findAll('.toolglows-main-button')).toHaveLength(1)
    expect(wrapper.get('.toolglows-main-button').attributes('aria-label')).toBe('ToolGlows')
    expect(wrapper.get('[data-toolglows-main] svg.toolglows-icon').attributes('viewBox')).toBe('0 0 24 24')
  })

  it('uses the same local SVG system for every toolbar action', async () => {
    const { toolglowsStore, wrapper } = await mountToolbar(true)
    const toolbarButtons = wrapper.findAll('.toolglows-tools-container button')

    expect(toolbarButtons).toHaveLength(toolglowsStore.tools.length + 1)
    expect(wrapper.findAll('.toolglows-tools-container .toolglows-tool-emoji')).toHaveLength(0)
    expect(wrapper.findAll('.toolglows-tools-container svg.toolglows-icon')).toHaveLength(toolbarButtons.length)
    expect(
      wrapper.findAll('.toolglows-tools-container svg.toolglows-icon')
        .map(icon => icon.attributes('data-icon-name'))
    ).toEqual(['settings', ...toolglowsStore.tools.map(tool => tool.id)])
    expect(
      wrapper.findAll('.toolglows-bar svg.toolglows-icon')
        .every(icon => icon.attributes('data-icon-resolved') === 'true')
    ).toBe(true)
  })

  it('activates every tool when the click lands on its icon', async () => {
    const { toolglowsStore, wrapper } = await mountToolbar(true)
    const panelTools = [
      'wordCount',
      'speedBrowsing',
      'infiniteScroll',
      'feedEradicator',
      'readerMode',
      'searchJumper',
      'dragOpen',
      'instagramSaved',
      'richCopy',
      'betterGmail',
      'quickActions'
    ]

    for (const toolId of panelTools) {
      await wrapper.get(`[data-tool-id="${toolId}"] svg`).trigger('click')
      await nextTick()
      expect(wrapper.get(`[data-tool-id="${toolId}"]`).classes()).toContain('toolglows-tool-button-active')
    }

    await wrapper.get('[data-tool-id="darkMode"] svg').trigger('click')
    await wrapper.get('[data-tool-id="autoCopy"] svg').trigger('click')
    await wrapper.get('[data-tool-id="hideElement"] svg').trigger('click')
    await wrapper.get('[data-tool-id="linksExplorer"] svg').trigger('click')
    await wrapper.get('[data-tool-id="socialAnalysis"] svg').trigger('click')
    await wrapper.get('[data-tool-id="reloadAllTabs"] svg').trigger('click')
    await nextTick()

    expect(darkModeState.setActive).toHaveBeenCalledWith(false)
    expect(toolglowsStore.toggleTool).toHaveBeenCalledWith('autoCopy')
    expect(actionStores.hideElement.settings.isSelectingElement).toBe(true)
    expect(actionStores.linksExplorer.exploreLinks).toHaveBeenCalledOnce()
    expect(actionStores.socialAnalysis.analyzeComments).toHaveBeenCalledOnce()
    expect(actionStores.reloadAllTabs.reloadAllTabs).toHaveBeenCalledOnce()
  })

  it('opens the toolbar and settings from their icons', async () => {
    const { settingsStore, wrapper } = await mountToolbar()

    await wrapper.get('[data-toolglows-main] svg').trigger('click')
    await nextTick()
    expect(settingsStore.settings.expanded).toBe(true)

    await wrapper.get('[data-toolglows-settings] svg').trigger('click')
    await nextTick()
    expect(wrapper.find('.toolglows-settings-content').exists()).toBe(true)
  })

  it('keeps the launcher foreground readable independently from page dark mode', async () => {
    const { settingsStore, wrapper } = await mountToolbar()
    settingsStore.settings.toolbarColor = AURORA_TOOLBAR_SURFACES.light
    await nextTick()
    const toolbar = wrapper.get('.toolglows-bar').element as HTMLElement
    const foreground = toolbar.style.getPropertyValue('--tg-toolbar-foreground')

    expect(getContrastRatio(foreground, settingsStore.settings.toolbarColor)).toBeGreaterThanOrEqual(TEXT_CONTRAST_MINIMUM)
  })

  it('keeps the Aurora toolbar surface aligned with the interface theme', async () => {
    darkModeState.options.palettePreset = 'latte'
    const { settingsStore, wrapper } = await mountToolbar()
    const toolbar = wrapper.get('.toolglows-bar')

    expect(toolbar.classes()).toContain('toolglows-palette-aurora')
    expect((toolbar.element as HTMLElement).style.backgroundColor).toBe(normalizeCssColor(AURORA_TOOLBAR_SURFACES.light))
    expect((toolbar.element as HTMLElement).style.getPropertyValue('--tg-toolbar-foreground')).toBe(AURORA_TOOLBAR_FOREGROUNDS.light)

    settingsStore.settings.interfaceTheme = 'dark'
    await nextTick()
    expect((toolbar.element as HTMLElement).style.backgroundColor).toBe(normalizeCssColor(AURORA_TOOLBAR_SURFACES.dark))
    expect((toolbar.element as HTMLElement).style.getPropertyValue('--tg-toolbar-foreground')).toBe(AURORA_TOOLBAR_FOREGROUNDS.dark)

    settingsStore.settings.interfaceTheme = 'light'
    await nextTick()
    expect((toolbar.element as HTMLElement).style.backgroundColor).toBe(normalizeCssColor(AURORA_TOOLBAR_SURFACES.light))
  })

  it.each([
    ['xxs', '0.3'],
    ['xs', '0.4'],
    ['xs-plus', '0.55'],
    ['sm', '0.75'],
    ['sm-plus', '0.875'],
    ['md', '1'],
    ['md-plus', '1.125'],
    ['lg', '1.25'],
    ['lg-plus', '1.375'],
    ['xl', '1.5'],
    ['xxl', '1.75'],
  ] as const)('applies the resolved %s scale to the whole ToolGlows interface', async (size, scale) => {
    const { settingsStore, wrapper } = await mountToolbar()

    settingsStore.settings.toolbarSize = size
    await nextTick()

    expect(
      document.documentElement.style.getPropertyValue('--tg-interface-scale'),
    ).toBe(scale)
    expect((wrapper.get('.toolglows-bar').element as HTMLElement).style.zoom).toBe(
      'var(--tg-interface-scale)',
    )
  })

  it('repositions the toolbar after its selected size changes', async () => {
    const { settingsStore, wrapper } = await mountToolbar()
    const toolbar = wrapper.get('.toolglows-bar').element as HTMLElement
    const toolbarRectWidth = 160
    const toolbarRectHeight = 112
    vi.spyOn(toolbar, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: toolbarRectWidth,
      height: toolbarRectHeight,
      top: 0,
      right: toolbarRectWidth,
      bottom: toolbarRectHeight,
      left: 0,
      toJSON: () => ({}),
    })
    settingsStore.settings.position = { x: window.innerWidth - 30, y: window.innerHeight - 30 }
    await nextTick()
    await nextTick()

    settingsStore.settings.toolbarSize = 'xl'
    await nextTick()
    await nextTick()

    expect(Number.parseFloat(toolbar.style.left)).toBeLessThanOrEqual(window.innerWidth - toolbarRectWidth)
    expect(Number.parseFloat(toolbar.style.top)).toBeLessThanOrEqual(window.innerHeight - toolbarRectHeight)
  })

  it('active un mode de réglage de taille à la molette depuis la modale', async () => {
    const { settingsStore, wrapper } = await mountToolbar(true)

    await wrapper.get('[data-toolglows-settings]').trigger('click')
    const wheelModeButton = wrapper.get('[data-toolglows-wheel-size]')
    await wheelModeButton.trigger('click')
    expect(wrapper.get('.toolglows-bar').classes()).toContain('toolglows-toolbar-wheel-mode')

    await dispatchWheel(wrapper.get('.toolglows-bar').element, 100)
    expect(settingsStore.settings.toolbarSize).toBe('sm-plus-mid')
  })

  it('désactive le mode molette au clic ou via Escape et restaure quand nécessaire', async () => {
    const { settingsStore, wrapper } = await mountToolbar(true)

    await wrapper.get('[data-toolglows-settings]').trigger('click')
    const wheelModeButton = wrapper.get('[data-toolglows-wheel-size]')
    await wheelModeButton.trigger('click')
    expect(wrapper.get('.toolglows-bar').classes()).toContain('toolglows-toolbar-wheel-mode')

    await dispatchWheel(wrapper.get('.toolglows-bar').element, 100)
    expect(settingsStore.settings.toolbarSize).toBe('sm-plus-mid')

    await wheelModeButton.trigger('click')
    expect(wrapper.get('.toolglows-bar').classes()).not.toContain('toolglows-toolbar-wheel-mode')

    await wheelModeButton.trigger('click')
    await dispatchWheel(wrapper.get('.toolglows-bar').element, 100)
    expect(settingsStore.settings.toolbarSize).toBe('sm-plus')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(wrapper.get('.toolglows-bar').classes()).not.toContain('toolglows-toolbar-wheel-mode')
    expect(settingsStore.settings.toolbarSize).toBe('sm-plus-mid')
  })

  it('désactive le mode molette quand on ferme la modale paramètres', async () => {
    const { settingsStore, wrapper } = await mountToolbar(true)

    await wrapper.get('[data-toolglows-settings]').trigger('click')
    const wheelModeButton = wrapper.get('[data-toolglows-wheel-size]')
    await wheelModeButton.trigger('click')
    expect(wrapper.get('.toolglows-bar').classes()).toContain('toolglows-toolbar-wheel-mode')

    await dispatchWheel(wrapper.get('.toolglows-bar').element, 100)
    expect(settingsStore.settings.toolbarSize).toBe('sm-plus-mid')

    await wrapper.get('[data-toolglows-settings]').trigger('click')
    expect(wrapper.get('.toolglows-bar').classes()).not.toContain('toolglows-toolbar-wheel-mode')

    await dispatchWheel(wrapper.get('.toolglows-bar').element, 100)
    expect(settingsStore.settings.toolbarSize).toBe('sm-plus-mid')
  })

  it('opens and closes on clicks without pointer movement', async () => {
    const { settingsStore, wrapper } = await mountToolbar(true)
    const button = wrapper.get('.toolglows-main-button')

    await dispatchPointer(button.element, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 })
    await dispatchPointer(button.element, 'pointerup', { pointerId: 1, clientX: 100, clientY: 100 })
    await button.trigger('click')
    expect(settingsStore.settings.expanded).toBe(false)

    await dispatchPointer(button.element, 'pointerdown', { pointerId: 2, clientX: 100, clientY: 100 })
    await dispatchPointer(button.element, 'pointerup', { pointerId: 2, clientX: 100, clientY: 100 })
    await button.trigger('click')
    expect(settingsStore.settings.expanded).toBe(true)
  })

  it('moves on drag and suppresses the click generated after pointer release', async () => {
    const { settingsStore, wrapper } = await mountToolbar()
    const button = wrapper.get('.toolglows-main-button')

    await dispatchPointer(button.element, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 })
    await dispatchPointer(button.element, 'pointermove', { pointerId: 1, clientX: 130, clientY: 120 })
    await dispatchPointer(button.element, 'pointerup', { pointerId: 1, clientX: 130, clientY: 120 })
    await button.trigger('click')

    expect(settingsStore.settings.expanded).toBe(false)
    expect(settingsStore.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ position: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }) })
    )
  })

  it('captures the pointer as soon as dragging starts', async () => {
    const { wrapper } = await mountToolbar()
    const button = wrapper.get('.toolglows-main-button')
    const capturePointer = vi.fn()
    ;(button.element as HTMLElement).setPointerCapture = capturePointer

    await dispatchPointer(button.element, 'pointerdown', { pointerId: 7, clientX: 100, clientY: 100 })

    expect(capturePointer).toHaveBeenCalledWith(7)
  })

  it('hides the toolbar overlay without unmounting when the popup setting is off', async () => {
    const { settingsStore, wrapper } = await mountToolbar()
    expect(wrapper.find('.toolglows-bar').isVisible()).toBe(true)

    settingsStore.settings.toolbarVisible = false
    await nextTick()

    const overlay = wrapper.find('.toolglows-bar')
    expect(overlay.exists()).toBe(true)
    expect(overlay.classes()).toContain('toolglows-overlay-hidden')
    expect(overlay.attributes('aria-hidden')).toBe('true')
  })

  it('excludes dialog overlays from outside-click dismissal', async () => {
    await mountToolbar()
    expect(outsideOptions.value?.ignore).toEqual(['.p-dialog', '.p-dialog-mask', '.p-tooltip'])
  })

  it('keeps inactive tools visible and toggles activation on left click', async () => {
    const { toolglowsStore, wrapper } = await mountToolbar(true)
    const activeButton = wrapper.get('[data-tool-id="darkMode"]')
    const inactiveButton = wrapper.get('[data-tool-id="wordCount"]')

    expect(activeButton.attributes('aria-pressed')).toBe('true')
    expect(activeButton.classes()).toContain('toolglows-tool-button-active')
    expect(inactiveButton.attributes('aria-pressed')).toBe('false')
    expect(inactiveButton.classes()).toContain('toolglows-tool-button-inactive')

    await inactiveButton.trigger('click')
    await nextTick()

    expect(toolglowsStore.toggleTool).not.toHaveBeenCalled()
    expect(inactiveButton.attributes('aria-pressed')).toBe('true')
    expect(inactiveButton.classes()).toContain('toolglows-tool-button-active')
  })

  it('opens tool settings on right click without changing activation', async () => {
    const { toolglowsStore, wrapper } = await mountToolbar(true)
    const inactiveButton = wrapper.get('[data-tool-id="wordCount"]')

    await inactiveButton.trigger('contextmenu')
    await flushPromises()
    await nextTick()

    expect(toolglowsStore.toggleTool).not.toHaveBeenCalled()
    expect(toolglowsStore.activeTools).toEqual(['darkMode'])
    expect(wrapper.findAll('[data-component="toolglows-tool"]')).toHaveLength(2)
  })

  it('connects the dark-mode button to the real dark-mode action', async () => {
    const { toolglowsStore, wrapper } = await mountToolbar(true)
    const darkModeButton = wrapper.get('[data-tool-id="darkMode"]')

    await darkModeButton.trigger('click')
    await nextTick()

    expect(darkModeState.setActive).toHaveBeenCalledWith(false)
    expect(darkModeState.isActive).toBe(false)
    expect(toolglowsStore.toggleTool).toHaveBeenCalledWith('darkMode')
    expect(darkModeButton.attributes('aria-pressed')).toBe('false')
  })

  it('fully disables persisted dark mode when it is removed from loaded tools', async () => {
    const { toolglowsStore } = await mountToolbar(true)

    toolglowsStore.activeTools.splice(0, 1)
    await nextTick()

    expect(darkModeState.setActive).toHaveBeenCalledWith(false)
  })

  it('executes command tools without exposing a pressed state', async () => {
    const { toolglowsStore, wrapper } = await mountToolbar(true)
    const reloadButton = wrapper.get('[data-tool-id="reloadAllTabs"]')

    expect(reloadButton.attributes('aria-pressed')).toBeUndefined()
    await reloadButton.trigger('click')

    expect(actionStores.reloadAllTabs.reloadAllTabs).toHaveBeenCalledOnce()
    expect(toolglowsStore.toggleTool).not.toHaveBeenCalled()
  })

  it('connects element hiding to the real selection mode', async () => {
    const { wrapper } = await mountToolbar(true)
    const hideButton = wrapper.get('[data-tool-id="hideElement"]')

    await hideButton.trigger('click')
    await nextTick()

    expect(actionStores.hideElement.settings.isSelectingElement).toBe(true)
    expect(hideButton.attributes('aria-pressed')).toBe('true')

    await hideButton.trigger('click')
    await nextTick()

    expect(actionStores.hideElement.settings.isSelectingElement).toBe(false)
    expect(hideButton.attributes('aria-pressed')).toBe('false')
  })
})
