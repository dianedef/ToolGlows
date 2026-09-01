import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const controlPattern = /<Slider|<InputNumber|type=.number|<Checkbox|<ToggleSwitch|<InputSwitch/i

describe('settings control rhythm', () => {
  it('covers every settings component through shared dialog composition', () => {
    const componentFiles = readdirSync('src/components')
      .filter(file => file.endsWith('.vue'))
      .filter(file => controlPattern.test(readFileSync(`src/components/${file}`, 'utf8')))
    const sharedStyles = readFileSync('src/assets/main.css', 'utf8')

    expect(componentFiles).toHaveLength(19)
    expect(sharedStyles).toContain('.field-checkbox')
    expect(sharedStyles).toContain('.toolglows-reader-choice')
    expect(sharedStyles).toContain('.field-slider')
    expect(sharedStyles).toContain('.toolglows-field-slider')
    expect(sharedStyles).toContain('.toolglows-field-spinner')
    expect(sharedStyles).toContain('.field:has(> .p-inputnumber)')
    expect(sharedStyles).toContain('grid-template-columns: minmax(0, 1fr) auto')
    expect(sharedStyles).toContain('flex: 0 1 var(--tg-size-field-inline)')
    expect(sharedStyles).toContain('max-width: var(--tg-size-field-inline)')
  })
})
