import { chromium } from 'playwright'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'toolglows-rich-menu-'))
const extension = resolve('dist/chrome')
let context
try {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: chromium.executablePath(), headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  })
  context.setDefaultTimeout(30000)
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
  await worker.evaluate(() => chrome.storage.sync.set({ toolglowsSettings: { interfaceTheme: 'dark' } }))
  const page = await context.newPage()
  await page.route('https://example.com/', route => route.fulfill({ contentType: 'text/html', body: '<h1>Menu opacity proof</h1>' }))
  await page.goto('https://example.com/')
  await page.locator('#toolglows-root').waitFor()
  await page.locator('[data-toolglows-main]').waitFor()
  await page.locator('[data-toolglows-main]').click()
  await page.locator('[data-tool-id="richCopy"]').waitFor()
  await page.locator('[data-tool-id="richCopy"]').click({ button: 'right' })
  await page.locator('.toolglows-dialog .p-dropdown').click()
  const panel = page.locator('.p-dropdown-panel')
  await panel.waitFor()
  const result = await panel.evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    opacity: getComputedStyle(element).opacity,
    styled: element.classList.contains('toolglows-settings-select-panel'),
    options: element.innerText,
  }))
  console.log(JSON.stringify(result))
  if (process.env.MENU_SCREENSHOT) await page.screenshot({ path: process.env.MENU_SCREENSHOT })
  assert.ok(result.styled, 'Dropdown is outside the ToolGlows overlay style boundary')
  assert.match(result.background, /^rgb\(/, 'Dropdown background must be opaque')
  assert.equal(result.opacity, '1')
  await page.getByRole('option', { name: 'HTML', exact: true }).click()
  assert.equal(await page.locator('.toolglows-dialog .p-dropdown-label').innerText(), 'HTML')
  const layout = await page.locator('.toolglows-dialog').evaluate(dialog => {
    const options = dialog.querySelector('.rich-copy-options')
    const styles = getComputedStyle(options)
    return {
      copyPadding: styles.padding,
      headerPadding: getComputedStyle(dialog.querySelector('.p-dialog-header')).padding,
      actionIcons: [...dialog.querySelectorAll('.rich-copy-format-actions .toolglows-icon')].map(icon =>
        ({ width: getComputedStyle(icon).width, height: getComputedStyle(icon).height })),
      replacementIcons: [...dialog.querySelectorAll('.replacement-inputs .toolglows-icon')].map(icon =>
        ({ width: getComputedStyle(icon).width, height: getComputedStyle(icon).height })),
    }
  })
  console.log(JSON.stringify(layout))
  assert.notEqual(layout.copyPadding, '0px', 'Rich Copy content requires dialog gutters')
  assert.notEqual(layout.headerPadding, '0px', 'Rich Copy title requires dialog gutters')
  assert.equal(layout.actionIcons.length, 6, 'Each format needs edit and delete controls')
  assert.ok(layout.actionIcons.every(icon => icon.width !== '0px' && icon.height !== '0px'),
    'Format action icons must have a visible size')
  assert.ok(layout.replacementIcons.every(icon => icon.width === '19.1875px' && icon.height === '19.1875px'),
    'Replacement arrows must use the standard icon size')
  console.log('Opaque menu and format selection passed')
} finally {
  await context?.close()
  assert.ok(resolve(profile).startsWith(`${resolve(tmpdir())}\\toolglows-rich-menu-`))
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
