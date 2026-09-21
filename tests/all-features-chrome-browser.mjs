import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const extensionPath = resolve('dist/chrome')
const profilePath = await mkdtemp(join(tmpdir(), 'toolglows-all-features-'))
const expectedTools = [
  'wordCount', 'darkMode', 'speedBrowsing', 'infiniteScroll', 'feedEradicator',
  'readerMode', 'searchJumper', 'dragOpen', 'instagramSaved', 'richCopy',
  'betterGmail', 'quickActions', 'autoCopy', 'linksExplorer', 'socialAnalysis',
  'reloadAllTabs', 'hideElement',
]
let context

try {
  context = await chromium.launchPersistentContext(profilePath, {
    executablePath: chromium.executablePath(),
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  })

  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
  const errors = []
  const page = context.pages()[0] ?? await context.newPage()
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  await page.route('https://example.com/**', route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="fr"><head><title>Fixture ToolGlows</title></head><body>
      <header><nav><a href="https://example.com/one">Premier lien</a><a href="https://example.com/two">Second lien</a></nav></header>
      <main><article><h1>Article de validation ToolGlows</h1>
        <p id="selection">Ce paragraphe contient assez de mots pour valider les outils de lecture, de copie et de comptage dans Chromium.</p>
        <p>Un second paragraphe fournit du contenu éditorial supplémentaire pour Readability.</p>
        <img alt="Illustration de test" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">
      </article><section aria-label="Flux social"><div role="article">Publication à masquer</div></section>
      <section><textarea id="editable">Texte sélectionnable pour la copie automatique.</textarea></section>
      <section aria-label="Commentaires"><p class="comment">Commentaire positif et utile.</p></section></main>
    </body></html>`,
  }))

  await page.goto('https://example.com/toolglows-fixture')
  await page.locator('#toolglows-root').waitFor()
  await page.getByRole('button', { name: 'ToolGlows' }).click()
  await page.locator('[data-tool-id]').first().waitFor({ timeout: 3_000 })
  const toolIds = await page.locator('[data-tool-id]').evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-tool-id')),
  )
  const missing = expectedTools.filter(tool => !toolIds.includes(tool))
  if (missing.length > 0) throw new Error(`Missing toolbar tools: ${missing.join(', ')}`)

  await page.locator('[data-toolglows-settings]').click()
  await page.waitForTimeout(250)
  const settingsOpened = await page.locator('[role="dialog"]').isVisible().catch(() => false)
  if (settingsOpened) {
    await page.locator('[role="dialog"] [data-pc-section="closebutton"]').click()
    await page.locator('[role="dialog"]').waitFor({ state: 'hidden' })
  }

  const results = []
  for (const toolId of expectedTools.filter(tool => tool !== 'reloadAllTabs')) {
    const button = page.locator(`[data-tool-id="${toolId}"]`)
    await button.click()
    await page.waitForTimeout(75)
    results.push({
      toolId,
      present: await button.isVisible(),
      pressed: await button.getAttribute('aria-pressed'),
      title: await button.getAttribute('title'),
    })

    if (['darkMode', 'autoCopy', 'hideElement'].includes(toolId)) {
      await button.click()
    } else if (!['linksExplorer', 'socialAnalysis'].includes(toolId)) {
      await page.evaluate(id => {
        document.querySelector(`[data-tool-id="${id}"]`)?.click()
      }, toolId)
      await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 1_000 }).catch(() => undefined)
    } else {
      await page.evaluate(() => {
        document.querySelector('[role="dialog"] [data-pc-section="closebutton"]')?.click()
      })
      await page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 1_000 }).catch(() => undefined)
    }
  }

  const reloadPage = await context.newPage()
  await reloadPage.route('https://example.com/**', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body><main>Reload target</main></body></html>',
  }))
  await reloadPage.goto('https://example.com/reload-target')
  await reloadPage.locator('#toolglows-root').waitFor()
  const [reloadedIsolatedTab] = await Promise.all([
    reloadPage.waitForEvent('domcontentloaded', { timeout: 3_000 }).then(() => true).catch(() => false),
    page.locator('[data-tool-id="reloadAllTabs"]').click(),
  ])
  results.push({ toolId: 'reloadAllTabs', present: true, reloadedIsolatedTab })

  const persisted = await worker.evaluate(async () => {
    const stored = await chrome.storage.sync.get('toolglowsSettings')
    return Array.isArray(stored.toolglowsSettings?.activeTools)
  })
  const report = {
    ok: true,
    browser: await context.browser()?.version(),
    tools: results,
    settingsPersisted: persisted,
    settingsOpened,
    errors,
  }
  console.log(JSON.stringify(report))
  if (!persisted) throw new Error('Toolbar settings were not persisted in chrome.storage.sync')
  if (errors.length > 0) throw new Error(`Browser errors:\n${errors.join('\n')}`)
} finally {
  await context?.close()
  await rm(profilePath, { recursive: true, force: true })
}
