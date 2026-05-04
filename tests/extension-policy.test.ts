import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import manifestConfig from '../manifest.config'
import packageJson from '../package.json' with { type: 'json' }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pngDimensions(filePath: string) {
  const buffer = fs.readFileSync(filePath)
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

describe('extension store-review policy', () => {
  it('keeps privileged manifest permissions to the current minimum', () => {
    expect(manifestConfig.permissions).toEqual(['storage', 'tabs'])
    expect('host_permissions' in manifestConfig).toBe(false)
    expect(manifestConfig.permissions).not.toContain('scripting')
    expect(manifestConfig.permissions).not.toContain('webNavigation')
    expect(manifestConfig.permissions).not.toContain('activeTab')
  })

  it('declares icon assets that match their manifest dimensions', () => {
    for (const [size, iconPath] of Object.entries(manifestConfig.icons ?? {})) {
      const expectedSize = Number(size)
      const dimensions = pngDimensions(path.join(root, iconPath))
      expect(dimensions).toEqual({ width: expectedSize, height: expectedSize })
    }
  })

  it('does not keep FormKit or markdown rendering packages that add review risk', () => {
    const dependencies = packageJson.dependencies ?? {}
    expect(dependencies).not.toHaveProperty('@formkit/vue')
    expect(dependencies).not.toHaveProperty('@formkit/themes')
    expect(dependencies).not.toHaveProperty('marked')
  })
})
