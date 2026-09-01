<template>
  <div class="control-wrapper">
    <Button
      class="control-button"
      :class="{ active: isEnabled }"
      icon="🐦"
      text
      rounded
      @click="togglePanel"
    />

    <div
      v-if="showPanel"
      class="settings-panel"
    >
      <h3>Twitter Minimal</h3>

      <Card>
        <!-- Options -->
        <div class="setting-group">
          <h4>Éléments à masquer</h4>
          
          <div class="option-row">
            <Checkbox
              v-model="options.hideExplore"
              input-id="hide-explore"
            />
            <label for="hide-explore">Explorer</label>
          </div>

          <div class="option-row">
            <Checkbox
              v-model="options.hideNotifications"
              input-id="hide-notifications"
            />
            <label for="hide-notifications">Notifications</label>
          </div>

          <div class="option-row">
            <Checkbox
              v-model="options.hideTrends"
              input-id="hide-trends"
            />
            <label for="hide-trends">Tendances</label>
          </div>

          <div class="option-row">
            <Checkbox
              v-model="options.hideWhoToFollow"
              input-id="hide-who-to-follow"
            />
            <label for="hide-who-to-follow">Suggestions d'abonnement</label>
          </div>
        </div>

        <Divider />

        <!-- Style -->
        <div class="setting-group">
          <h4>Style</h4>
          
          <div class="option-row">
            <Checkbox
              v-model="options.centerTimeline"
              input-id="center-timeline"
            />
            <label for="center-timeline">Centrer le fil d'actualité</label>
          </div>

          <div class="option-row">
            <Checkbox
              v-model="options.hideMetrics"
              input-id="hide-metrics"
            />
            <label for="hide-metrics">Masquer les métriques (likes, retweets)</label>
          </div>

          <div class="width-row">
            <label for="timeline-width">Largeur du fil d'actualité</label>
            <Slider
              v-model="options.timelineWidth"
              :min="500"
              :max="1200"
              :step="50"
              input-id="timeline-width"
            />
            <span class="width-value">{{ options.timelineWidth }}px</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMinimalTwitter } from '@/composables/useMinimalTwitter'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'

const {
  isEnabled,
  options,
  init
} = useMinimalTwitter()

const showPanel = ref(false)

const togglePanel = () => {
  showPanel.value = !showPanel.value
}

onMounted(() => {
  const cleanup = init()
  onUnmounted(cleanup)
})
</script>

<style scoped>
.control-wrapper {
  position: relative;
}

.settings-panel {
  position: absolute;
  top: var(--tg-full-height);
  right: 0;
  width: var(--tg-size-300);
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: var(--tg-space-4);
  z-index: var(--tg-z-dropdown);
}

.setting-group {
  margin-bottom: var(--tg-space-4);
}

.setting-group h4 {
  margin-bottom: var(--tg-space-2);
  color: var(--text-color);
}

.option-row {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
  margin-bottom: var(--tg-space-2);
}

.width-row {
  display: flex;
  flex-direction: column;
  gap: var(--tg-space-2);
  margin-top: var(--tg-space-4);
}

.width-row label {
  color: var(--text-color-secondary);
  font-size: var(--tg-size-icon-sm);
}

.width-value {
  color: var(--text-color-secondary);
  font-size: var(--tg-size-icon-sm);
  text-align: right;
}

:deep(.p-card) {
  margin-bottom: 0;
}

:deep(.p-card .p-card-content) {
  padding: var(--tg-space-4);
}

:deep(.p-slider) {
  margin: var(--tg-space-2) 0;
}
</style> 
