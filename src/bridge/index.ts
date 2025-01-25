import { sendMessage, onMessage } from 'webext-bridge/content-script'
import type { Tool } from '@/types/tools'

// Types pour les messages
export type BridgeMessage = {
  type: 'SETTINGS_UPDATED' | 'TOOLS_UPDATED' | 'GET_INITIAL_STATE'
  payload?: any
}

// Fonctions pour envoyer des messages au background script
export const bridgeApi = {
  async updateSettings(settings: any) {
    return await sendMessage('SETTINGS_UPDATED', { settings }, 'background')
  },

  async updateTools(tools: Tool[]) {
    return await sendMessage('TOOLS_UPDATED', { tools }, 'background')
  },

  async getInitialState() {
    return await sendMessage('GET_INITIAL_STATE', {}, 'background')
  }
}

// Écouteurs pour les mises à jour depuis le background
export const initBridgeListeners = (callbacks: {
  onSettingsUpdate?: (settings: any) => void
  onToolsUpdate?: (tools: Tool[]) => void
}) => {
  onMessage('SETTINGS_SYNC', ({ data }) => {
    callbacks.onSettingsUpdate?.(data.settings)
  })

  onMessage('TOOLS_SYNC', ({ data }) => {
    callbacks.onToolsUpdate?.(data.tools)
  })
} 