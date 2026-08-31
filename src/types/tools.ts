import type { Component } from 'vue'

export type ToolCategory = 'reading' | 'appearance' | 'navigation' | 'social'
export type ToolInteraction = 'toggle' | 'command' | 'panel'

export interface Tool {
  id: string
  name: string
  component: Component
  icon: string
  emoji: string
  category: ToolCategory
  interaction: ToolInteraction
}
