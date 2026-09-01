import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const footerConsumers = [
  'BetterGmailControl.vue',
  'DragOpenControl.vue',
  'InstagramSavedLibrary.vue',
  'RichCopyControl.vue',
  'SearchJumperUI.vue',
  'WordCounterPopup.vue'
]

describe('dialog action hierarchy', () => {
  it('governs every concrete footer through the shared dialog shell', () => {
    const consumers = footerConsumers.map((file) =>
      readFileSync(`src/components/${file}`, 'utf8')
    )
    const footerCount = consumers.reduce(
      (count, source) =>
        count + (source.match(/<template #footer>/g)?.length ?? 0),
      0
    )
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')

    expect(footerCount).toBe(9)
    expect(sharedStyles).toContain(
      'min-width: var(--tg-size-dialog-action-min)'
    )
    expect(sharedStyles).toContain(
      'min-height: var(--tg-size-control-comfortable)'
    )
    expect(sharedStyles).toContain('.p-button:first-child:not(:only-child)')
    expect(sharedStyles).toContain('margin-inline-end: auto')
    expect(sharedStyles).toContain('@media (max-width: 30rem)')
    expect(sharedStyles).toContain('flex: 1 1 var(--tg-full-width)')
  })

  it('keeps the word-counter footer actions as direct ordered children', () => {
    const source = readFileSync('src/components/WordCounterPopup.vue', 'utf8')
    const footer = source.match(/<template #footer>([\s\S]*?)<\/template>/)?.[1]

    expect(footer).toBeDefined()
    expect(footer).not.toContain('dialog-footer')
    expect(footer?.indexOf('label="Fermer"')).toBeLessThan(
      footer?.indexOf('label="Copier les statistiques"') ?? -1
    )
    expect(footer).not.toContain('severity="secondary"')
  })
})
