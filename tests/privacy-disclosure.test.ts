import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const privacyPolicy = readFileSync('src/ui/common/pages/privacy-policy.vue', 'utf8')
const disclosureMatrix = readFileSync(
  'shipglows_data/technical/extension-data-and-permissions.md',
  'utf8'
)

describe('privacy and store disclosures', () => {
  it('does not retain the template account and contact claims', () => {
    expect(privacyPolicy).not.toContain('support@example.com')
    expect(privacyPolicy).not.toContain('create an account')
    expect(privacyPolicy).not.toContain('subscribe to our newsletter')
  })

  it('discloses local page processing, storage, transmission, and all-site access', () => {
    expect(privacyPolicy).toContain('Données traitées localement')
    expect(privacyPolicy).toContain('un service tiers')
    expect(privacyPolicy).toContain('toutes les URL')
    expect(privacyPolicy).toContain('stockage de l’extension')
  })

  it('does not claim or package the removed OCR prototype', () => {
    expect(privacyPolicy).not.toContain('OCR')
    expect(disclosureMatrix).toContain('incomplete OCR prototype is not part')
  })

  it('keeps an explicit permission and data inventory for store review', () => {
    for (const permission of ['<all_urls>', 'storage', 'tabs', 'bookmarks', 'alarms', 'scripting']) {
      expect(disclosureMatrix).toContain(`\`${permission}\``)
    }
    expect(disclosureMatrix).toContain('Firefox `data_collection_permissions.required')
  })
})
