/* @vitest-environment jsdom */
import { afterEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import InstallJourney from '../src/components/install.vue'
import { EXPERIMENTAL_TOOL_IDS, TOOL_GROUPS, validateToolCatalog } from '../src/data/toolCatalog'

const wrapper = { current: null as ReturnType<typeof mount> | null }

function mockStorage(options: {
  settings?: Record<string, unknown>
  getSync?: () => Promise<Record<string, unknown>>
  setSync?: (values: Record<string, unknown>) => Promise<void>
  getLocal?: () => Promise<Record<string, unknown>>
  setLocal?: (values: Record<string, unknown>) => Promise<void>
} = {}) {
  const data = { ...(options.settings ? { toolglowsSettings: options.settings } : {}) }
  const sync = {
    get: vi.fn(options.getSync ?? (async () => ({ ...data }))),
    set: vi.fn(options.setSync ?? (async (values: Record<string, unknown>) => { Object.assign(data, values) }))
  }
  const localData: Record<string, unknown> = {}
  const local = {
    get: vi.fn(options.getLocal ?? (async () => ({ ...localData }))),
    set: vi.fn(options.setLocal ?? (async (values: Record<string, unknown>) => { Object.assign(localData, values) }))
  }
  vi.stubGlobal('chrome', {
    storage: {
      sync,
      local,
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() }
    }
  })
  return { data, sync, local, localData }
}

async function mountJourney() {
  wrapper.current = mount(InstallJourney, { global: { stubs: { ToolGlowsIcon: true } } })
  await flushPromises()
  return wrapper.current
}

afterEach(() => {
  wrapper.current?.unmount()
  wrapper.current = null
  vi.unstubAllGlobals()
})

it('presents default explanations and one factual catalog entry per registered tool', async () => {
  const { sync, local } = mockStorage()
  wrapper.current = await mountJourney()

  const toolbarSource = readFileSync(resolve(process.cwd(), 'src/components/ToolGlowsBar.vue'), 'utf8')
  const registrationBlock = toolbarSource.match(/const initialTools: Tool\[\] = \[([\s\S]*?)\n\]/)?.[1]
  expect(registrationBlock).toBeTruthy()
  const registeredIds = [...registrationBlock!.matchAll(/id: '([^']+)'/g)].map(([, id]) => id)
  const ids = TOOL_GROUPS.flatMap(group => group.ids)
  expect(validateToolCatalog(registeredIds)).toBe(true)
  expect(wrapper.current.findAll('[data-tool-catalog-id]').map(item => item.attributes('data-tool-catalog-id'))).toEqual(ids)
  expect(wrapper.current.text()).toContain('Les explications sont activées')
  expect(wrapper.current.text()).not.toContain('Découvrir sans explications')
  expect(wrapper.current.text()).not.toContain('Afficher les explications des outils')
  expect(wrapper.current.findAll('.catalog-icon[aria-pressed="true"]')).toHaveLength(0)
  expect(wrapper.current.findAll('.experimental-tag')).toHaveLength(EXPERIMENTAL_TOOL_IDS.length)
  expect(sync.set).not.toHaveBeenCalled()
  expect(local.set).not.toHaveBeenCalled()
})

it('toggles a tool on and off, persisting activeTools without replacing other settings', async () => {
  const initial = { activeTools: [], toolbarColor: '#123456', expanded: true }
  const { data, sync } = mockStorage({ settings: initial })
  const view = await mountJourney()
  const button = view.get('button[aria-label="Activer Mode lecture"]')

  await button.trigger('click')
  await flushPromises()
  expect(data.toolglowsSettings).toEqual({ ...initial, activeTools: ['readerMode'] })
  expect(view.get('button[aria-label="Désactiver Mode lecture"]').attributes('aria-pressed')).toBe('true')

  await view.get('button[aria-label="Désactiver Mode lecture"]').trigger('click')
  await flushPromises()
  expect(data.toolglowsSettings).toEqual(initial)
  expect(sync.set).toHaveBeenCalledTimes(2)
})

it('toggles cookie consent only through its separate local preference', async () => {
  const { sync, local, localData } = mockStorage()
  const view = await mountJourney()
  const cookieButton = view.get('button[aria-label="Activer Acceptation des cookies"]')
  expect(cookieButton.attributes('aria-pressed')).toBe('false')

  await cookieButton.trigger('click')
  await flushPromises()
  expect(localData.toolglowsCookieConsent).toMatchObject({ enabled: true })
  expect(sync.set).not.toHaveBeenCalled()
  expect(local.set).toHaveBeenCalledTimes(1)
})

it('keeps controls disabled while settings are loading and reports storage read errors', async () => {
  const { sync } = mockStorage({ getSync: () => new Promise(() => {}) })
  wrapper.current = mount(InstallJourney, { global: { stubs: { ToolGlowsIcon: true } } })
  expect(wrapper.current.get('.catalog-icon').attributes('disabled')).toBeDefined()
  wrapper.current.unmount()
  wrapper.current = null
  vi.unstubAllGlobals()

  mockStorage({ getSync: async () => { throw new Error('read failed') } })
  const view = await mountJourney()
  expect(view.get('[role="alert"]').text()).toContain('Impossible de charger les outils activés')
  expect(view.get('.catalog-icon').attributes('disabled')).toBeDefined()
})

it('keeps an activation off and reports storage write errors', async () => {
  let failFirstWrite = true
  const { data } = mockStorage({ setSync: async values => {
    if (failFirstWrite) {
      failFirstWrite = false
      Object.assign(data, values)
      throw new Error('write failed')
    }
    Object.assign(data, values)
  } })
  const view = await mountJourney()
  await view.get('button[aria-label="Activer Mode lecture"]').trigger('click')
  await flushPromises()

  expect(view.get('button[aria-label="Activer Mode lecture"]').attributes('aria-pressed')).toBe('false')
  expect(view.get('[role="alert"]').text()).toContain('Impossible d’enregistrer cet outil')
  await view.get('.retry-button').trigger('click')
  await flushPromises()
  expect(data.toolglowsSettings.activeTools).toEqual(['readerMode'])
  expect(view.get('button[aria-label="Désactiver Mode lecture"]').attributes('aria-pressed')).toBe('true')
})

it('retries a cookie opt-in as the same desired state when storage reports an uncertain failure', async () => {
  let failFirstWrite = true
  const { localData } = mockStorage({ setLocal: async values => {
    if (failFirstWrite) {
      failFirstWrite = false
      Object.assign(localData, values)
      throw new Error('write result uncertain')
    }
    Object.assign(localData, values)
  } })
  const view = await mountJourney()

  await view.get('button[aria-label="Activer Acceptation des cookies"]').trigger('click')
  await flushPromises()
  expect(localData.toolglowsCookieConsent.enabled).toBe(true)
  expect(view.get('button[aria-label="Activer Acceptation des cookies"]').attributes('aria-pressed')).toBe('false')

  await view.get('.retry-button').trigger('click')
  await flushPromises()
  expect(localData.toolglowsCookieConsent.enabled).toBe(true)
  expect(view.get('button[aria-label="Désactiver Acceptation des cookies"]').attributes('aria-pressed')).toBe('true')
})
