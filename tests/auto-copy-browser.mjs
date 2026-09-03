import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const extensionPath = resolve('dist/chrome')
const profilePath = await mkdtemp(join(tmpdir(), 'toolglows-auto-copy-'))
const chromiumPath = 'C:\\Users\\Diane\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe'
const diagnostics = []
let context

try {
  context = await chromium.launchPersistentContext(profilePath, {
    executablePath: chromiumPath,
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  })
  const serviceWorker = context.serviceWorkers()[0]
    ?? await context.waitForEvent('serviceworker')
  await serviceWorker.evaluate(async () => {
    await chrome.storage.sync.set({
      toolglowsSettings: { activeTools: ['wordCounter'] },
      autoCopySettings: {
        activeFormat: 'text',
        preserveFormatting: true,
        includeSource: true,
        showNotifications: true,
        enableAltSelection: true
      }
    })
  })

  const page = context.pages()[0] ?? await context.newPage()
  page.on('console', message => diagnostics.push(message.text()))
  await page.goto('https://example.com')
  await page.locator('#toolglows-root').waitFor()
  await page.locator('[data-toolglows-main]').click()
  const autoCopyButton = page.locator('[data-tool-id="autoCopy"]')
  await autoCopyButton.click()
  if (await autoCopyButton.getAttribute('aria-pressed') !== 'true') {
    throw new Error('Auto Copy did not become active through the toolbar')
  }
  await page.locator('h1').evaluate(element => element.classList.add('p-4', 'gap-2'))
  const headingBox = await page.locator('h1').boundingBox()
  if (!headingBox) throw new Error('Example heading bounds not found')
  await page.mouse.move(headingBox.x + 2, headingBox.y + headingBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    headingBox.x + headingBox.width - 2,
    headingBox.y + headingBox.height / 2,
    { steps: 12 }
  )
  await page.mouse.up()
  const selectedText = await page.evaluate(() => window.getSelection()?.toString() ?? '')
  if (!selectedText.trim()) throw new Error('Pointer gesture produced no text selection')
  const selectionColor = await page.locator('h1').evaluate(element =>
    getComputedStyle(element, '::selection').backgroundColor
  )
  if (selectionColor === 'rgba(0, 0, 0, 0)' || selectionColor === 'transparent') {
    throw new Error(`Selection feedback is not visible: ${JSON.stringify(selectionColor)}`)
  }

  const toast = page.locator('.p-toast-message')
  await toast.waitFor()
  await context.grantPermissions(['clipboard-read'], { origin: 'https://example.com' })
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  const notificationCount = await toast.count()
  const notificationText = await toast.first().innerText()
  const notificationStyle = await toast.first().evaluate(element => {
    const style = getComputedStyle(element)
    const content = element.querySelector('.p-toast-message-content')
    return {
      backgroundColor: style.backgroundColor,
      opacity: style.opacity,
      contentDisplay: content ? getComputedStyle(content).display : ''
    }
  })
  const leakedSelection = diagnostics.some(message => message.includes(clipboard))

  if (clipboard.trim() !== selectedText.trim()) {
    throw new Error(`Unexpected clipboard value: ${JSON.stringify(clipboard)}`)
  }
  if (notificationCount !== 1) {
    throw new Error(`Expected one notification, observed ${notificationCount}`)
  }
  if (!notificationText.includes('Text copied')) {
    throw new Error(`Unexpected notification: ${JSON.stringify(notificationText)}`)
  }
  if (notificationStyle.opacity !== '1'
    || notificationStyle.backgroundColor === 'rgba(0, 0, 0, 0)'
    || notificationStyle.contentDisplay !== 'grid') {
    throw new Error(`Unreadable notification style: ${JSON.stringify(notificationStyle)}`)
  }
  if (leakedSelection) {
    throw new Error('Clipboard content appeared in content-script diagnostics')
  }

  await context.clearPermissions()
  const deniedPage = await context.newPage()
  deniedPage.on('console', message => diagnostics.push(message.text()))
  await deniedPage.goto('https://example.com')
  await deniedPage.locator('#toolglows-root').waitFor()
  await deniedPage.evaluate(() => {
    const heading = document.querySelector('h1')
    if (!heading) throw new Error('Example heading not found')
    const range = document.createRange()
    range.selectNodeContents(heading)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  })
  await deniedPage.locator('h1').dispatchEvent('pointerup')

  const deniedToast = deniedPage.locator('.p-toast-message')
  await deniedToast.waitFor()
  const deniedNotificationCount = await deniedToast.count()
  const deniedNotificationText = await deniedToast.first().innerText()
  const deniedNotificationClass = await deniedToast.first().getAttribute('class') ?? ''
  if (deniedNotificationCount !== 1 || !deniedNotificationText.includes('Text copied')) {
    throw new Error(`Unexpected denied-permission fallback result: ${JSON.stringify(deniedNotificationText)}`)
  }
  if (diagnostics.some(message => message.includes(selectedText.trim()))) {
    throw new Error('Selected content appeared in diagnostics during denied clipboard flow')
  }

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://example.com' })
  await serviceWorker.evaluate(() => chrome.storage.sync.set({
    toolglowsSettings: { activeTools: ['autoCopy'] }
  }))
  const framePage = await context.newPage()
  await framePage.route('https://example.com/auto-copy-*', route => {
    const isChild = route.request().url().endsWith('auto-copy-child')
    return route.fulfill({
      contentType: 'text/html',
      body: isChild
        ? '<p id="frame-selection">iframe selected value</p>'
        : '<iframe src="/auto-copy-child"></iframe>'
    })
  })
  await framePage.goto('https://example.com/auto-copy-parent')
  await framePage.locator('#toolglows-root').waitFor()
  await framePage.locator('[data-toolglows-main]').click()
  const framePageAutoCopy = framePage.locator('[data-tool-id="autoCopy"]')
  if (await framePageAutoCopy.getAttribute('aria-pressed') !== 'true') {
    await framePageAutoCopy.click()
  }
  const childFrame = framePage.frames().find(frame => frame.url().endsWith('auto-copy-child'))
  if (!childFrame) throw new Error('Auto Copy child frame was not created')
  await childFrame.locator('#frame-selection').evaluate(element => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const selection = getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  })
  const frameToast = childFrame.locator('#toolglows-frame-copy-status')
  await framePage.waitForTimeout(500)
  const frameClipboard = await framePage.evaluate(() => navigator.clipboard.readText())
  if (frameClipboard !== 'iframe selected value') {
    throw new Error(`Iframe selection was not copied exactly: ${JSON.stringify(frameClipboard)}`)
  }
  await frameToast.waitFor({ timeout: 5000 })

  const performancePage = await context.newPage()
  await performancePage.route('https://example.com/auto-copy-performance', route => route.fulfill({
    contentType: 'text/html',
    body: `<main>${'<div>block</div>'.repeat(10000)}</main>`
  }))
  await performancePage.goto('https://example.com/auto-copy-performance')
  await performancePage.locator('#toolglows-root').waitFor()
  const altPerformance = await performancePage.evaluate(async () => {
    const start = performance.now()
    let timerDelay = 0
    const probe = new Promise(resolve => setTimeout(() => {
      timerDelay = performance.now() - start - 205
      resolve(undefined)
    }, 205))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }))
    await probe
    const inlineOutlines = [...document.querySelectorAll('div')]
      .filter(element => element.style.outline).length
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt', bubbles: true }))
    return { timerDelayMs: Math.round(timerDelay), inlineOutlines }
  })
  if (altPerformance.timerDelayMs > 100 || altPerformance.inlineOutlines !== 0) {
    throw new Error(`Alt mode exceeded its constant-work budget: ${JSON.stringify(altPerformance)}`)
  }

  console.log(JSON.stringify({
    ok: true,
    copiedCharacters: clipboard.trim().length,
    notificationCount,
    notification: notificationText.replace(/\s+/g, ' ').trim(),
    notificationStyle,
    selectionColor,
    iframeClipboard: frameClipboard,
    altPerformance,
    deniedPermissionFallback: deniedNotificationClass.includes('p-toast-message-success')
      ? 'copied-with-success-notification'
      : 'unexpected-notification-state',
    diagnosticsRedacted: true
  }))
} finally {
  await context?.close()
  const resolvedProfile = resolve(profilePath)
  const resolvedTemp = resolve(tmpdir())
  if (!resolvedProfile.startsWith(`${resolvedTemp}\\toolglows-auto-copy-`)) {
    throw new Error(`Refusing to remove unexpected profile path: ${resolvedProfile}`)
  }
  await rm(resolvedProfile, { recursive: true, force: true })
}
