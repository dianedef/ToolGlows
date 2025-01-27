import { onMounted, onUnmounted } from 'vue'

export function useExcludeToolflowzBar() {
  const TOOLFLOWZ_SELECTORS = [
    '.toolflowz-bar',
    '[data-component="toolflowz-tool"]',
    '.p-dialog[class*="toolflowz"]',
    '.p-dialog-mask',
    '.toolflowz-settings-content',
    '.toolflowz-tools-grid',
    '.toolflowz-tool-item',
    '.toolflowz-setting-item',
    '.toolflowz-tools-container',
    '.toolflowz-settings-group',
    '.toolflowz-settings-header',
    '.toolflowz-tool-emoji'
  ].join(', ')
  
  function addExclusionStyles() {
    const style = document.createElement('style')
    style.id = 'toolflowz-exclusion-styles'
    style.textContent = `
      /* Réinitialiser les styles pour tous les composants Toolflowz et leurs enfants */
      ${TOOLFLOWZ_SELECTORS},
      ${TOOLFLOWZ_SELECTORS} *,
      .p-dialog[class*="toolflowz"] *,
      [data-component="toolflowz-tool"] * {
        background-color: var(--surface-card) !important;
        color: var(--text-color) !important;
      }
      
      /* Styles spécifiques pour les éléments internes */
      .p-dialog-header,
      .p-dialog-content,
      .p-checkbox-box,
      .p-checkbox-input,
      input,
      .toolflowz-tool-emoji,
      .toolflowz-settings-group,
      .toolflowz-settings-header,
      .toolflowz-settings-content h3,
      .toolflowz-tool-name,
      .toolflowz-setting-item label,
      .p-dialog[class*="toolflowz"] .p-dialog-header,
      .p-dialog[class*="toolflowz"] .p-dialog-content {
        background-color: var(--surface-card) !important;
        color: var(--text-color) !important;
      }

      /* Styles pour les boutons et contrôles */
      .p-button,
      input,
      select,
      textarea,
      .p-checkbox,
      .p-checkbox-box,
      .p-inputtext,
      .p-dropdown,
      .p-multiselect {
        background-color: var(--surface-ground) !important;
        color: var(--text-color) !important;
        border-color: var(--surface-border) !important;
      }
      
      /* Styles pour les liens */
      a {
        color: var(--primary-color) !important;
      }

      /* Styles pour le masque de dialogue */
      .p-dialog-mask {
        background-color: rgba(0, 0, 0, 0.4) !important;
      }

      /* Styles pour les éléments de liste et grilles */
      .p-datatable,
      .p-grid,
      .p-panel,
      .toolflowz-tool-item,
      .toolflowz-setting-item,
      .toolflowz-settings-group {
        background-color: var(--surface-ground) !important;
        color: var(--text-color) !important;
      }

      /* Styles pour les éléments actifs */
      .toolflowz-tool-item.active,
      .toolflowz-setting-item.active,
      .p-button.p-highlight,
      .p-checkbox-checked .p-checkbox-box {
        background-color: var(--primary-color) !important;
        color: var(--primary-color-text) !important;
      }

      /* Styles pour les survols */
      .toolflowz-tool-item:hover,
      .toolflowz-setting-item:hover,
      .p-button:hover {
        background-color: var(--surface-hover) !important;
      }

      /* Styles pour les icônes */
      .p-icon,
      .pi {
        color: var(--text-color) !important;
      }
    `
    document.head.appendChild(style)
  }

  function removeExclusionStyles() {
    const style = document.getElementById('toolflowz-exclusion-styles')
    if (style) {
      style.remove()
    }
  }

  onMounted(() => {
    addExclusionStyles()
  })

  onUnmounted(() => {
    removeExclusionStyles()
  })

  return {
    addExclusionStyles,
    removeExclusionStyles
  }
} 