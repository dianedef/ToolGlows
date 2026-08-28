import { onMounted, onUnmounted } from 'vue'

export function useExcludeToolGlowsBar() {
  const TOOLGLOWS_SELECTORS = [
    '.toolglows-bar',
    '[data-component="toolglows-tool"]',
    '.p-dialog[class*="toolglows"]',
    '.p-dialog-mask',
    '.toolglows-settings-content',
    '.toolglows-tools-grid',
    '.toolglows-tool-item',
    '.toolglows-setting-item',
    '.toolglows-tools-container',
    '.toolglows-settings-group',
    '.toolglows-settings-header',
    '.toolglows-tool-emoji',
    '.p-toast',
    '.p-toast-message',
    '.p-toast-message-content',
    '.p-toast-message-icon',
    '.p-toast-message-text',
    '.p-toast-detail',
    '.p-toast-icon-close'
  ].join(', ')

  function addExclusionStyles() {
    const style = document.createElement('style')
    style.id = 'toolglows-exclusion-styles'
    style.textContent = `
      /* Réinitialiser les styles pour tous les composants ToolGlows et leurs enfants */
      ${TOOLGLOWS_SELECTORS},
      ${TOOLGLOWS_SELECTORS} *,
      .p-dialog[class*="toolglows"] *,
      [data-component="toolglows-tool"] * {
        background-color: var(--surface-card) !important;
        color: var(--text-color) !important;
      }

      /* Styles spécifiques pour les éléments internes */
      .p-dialog-header,
      .p-dialog-content,
      .p-checkbox-box,
      .p-checkbox-input,
      input,
      .toolglows-tool-emoji,
      .toolglows-settings-group,
      .toolglows-settings-header,
      .toolglows-settings-content h3,
      .toolglows-tool-name,
      .toolglows-setting-item label,
      .p-dialog[class*="toolglows"] .p-dialog-header,
      .p-dialog[class*="toolglows"] .p-dialog-content,
      .p-toast,
      .p-toast-message,
      .p-toast-message-content {
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
      .p-multiselect,
      .p-toast-icon-close,
      .p-togglebutton,
      .p-togglebutton-input,
      .p-togglebutton-box {
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
        background-color: var(--tg-scrim) !important;
      }

      /* Styles pour les éléments de liste et grilles */
      .p-datatable,
      .p-grid,
      .p-panel,
      .toolglows-tool-item,
      .toolglows-setting-item,
      .toolglows-settings-group {
        background-color: var(--surface-ground) !important;
        color: var(--text-color) !important;
      }

      /* Styles pour les éléments actifs */
      .toolglows-tool-item.active,
      .toolglows-setting-item.active,
      .p-button.p-highlight {
        background-color: var(--highlight-bg) !important;
        color: var(--highlight-text-color) !important;
      }

      .p-checkbox.p-highlight .p-checkbox-box {
        background-color: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
        color: var(--primary-color-text) !important;
      }

      .p-checkbox.p-highlight .p-checkbox-icon {
        color: var(--primary-color-text) !important;
      }

      /* Styles pour les survols */
      .toolglows-tool-item:hover,
      .toolglows-setting-item:hover,
      .p-button:hover,
      .p-toast-icon-close:hover {
        background-color: var(--surface-hover) !important;
      }

      /* Styles pour les icônes */
      .p-icon,
      .pi,
      .p-toast-message-icon {
        color: var(--text-color) !important;
      }

      /* Styles spécifiques pour les toasts */
      .p-toast {
        opacity: 1 !important;
      }

      .p-toast-message-success {
        border-left-color: var(--green-500) !important;
      }

      .p-toast-message-info {
        border-left-color: var(--blue-500) !important;
      }

      .p-toast-message-warn {
        border-left-color: var(--yellow-500) !important;
      }

      .p-toast-message-error {
        border-left-color: var(--red-500) !important;
      }

      /* Styles spécifiques pour le toggle button */
      .p-togglebutton {
        &.p-highlight {
          background-color: var(--primary-color) !important;
          border-color: var(--primary-color) !important;

          .p-button-label {
            color: var(--primary-color-text) !important;
          }
        }

        &:not(.p-disabled):hover {
          background-color: var(--surface-hover) !important;
        }
      }

      .p-togglebutton-input {
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
    `
    document.head.appendChild(style)
  }

  function removeExclusionStyles() {
    const style = document.getElementById('toolglows-exclusion-styles')
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
