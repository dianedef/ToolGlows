import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('production diagnostic redaction', () => {
  it('does not log synchronized payload values', () => {
    expect(source('../src/background/index.ts')).not.toMatch(/console\.\w+\([^\n]*,\s*data\b/)
    expect(source('../src/bridge/index.ts')).not.toMatch(/console\.\w+\([^\n]*,\s*data\b/)
    expect(source('../src/stores/settings.ts')).not.toMatch(
      /console\.\w+\([^\n]*,\s*(newSettings|settings\.value)\b/,
    )
  })
})
