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
  top: 100%;
  right: 0;
  width: 300px;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 1rem;
  z-index: 1000;
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-group h4 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.width-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.width-row label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.width-value {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  text-align: right;
}

:deep(.p-card) {
  margin-bottom: 0;
}

:deep(.p-card .p-card-content) {
  padding: 1rem;
}

:deep(.p-checkbox) {
  width: 1.25rem;
  height: 1.25rem;
}

:deep(.p-slider) {
  margin: 0.5rem 0;
}
</style> 