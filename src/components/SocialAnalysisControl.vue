<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="'👥 Analyse Sociale'"
    :style="{ width: '70vw' }"
    :breakpoints="{ '960px': '85vw', '641px': '100vw' }"
    :maximizable="true"
    :dismissableMask="true"
    class="toolflowz-social-analysis-dialog"
  >
    <div class="toolflowz-social-analysis-content">
      <!-- En-tête avec plateforme -->
      <div class="toolflowz-platform-header">
        <h3>
          {{ platformEmoji }} {{ platformName }}
          <span v-if="platform === 'unknown'" class="toolflowz-platform-warning">
            (Plateforme non supportée)
          </span>
        </h3>
      </div>

      <!-- Actions -->
      <div class="toolflowz-social-analysis-actions">
        <Button
          @click="analyzeComments"
          icon="pi pi-search"
          label="Analyser les commentaires"
          :loading="isLoading"
          :disabled="platform === 'unknown'"
          class="toolflowz-action-button"
        />
        <Button
          @click="exportToCSV"
          icon="pi pi-download"
          label="Exporter en CSV"
          :disabled="!comments.length"
          class="toolflowz-action-button"
        />
      </div>

      <!-- Statistiques -->
      <div v-if="comments.length" class="toolflowz-stats-container">
        <!-- Distribution par genre -->
        <div class="toolflowz-stats-card">
          <h4>📊 Distribution par genre</h4>
          <div class="toolflowz-stats-grid">
            <div class="toolflowz-stat-item">
              <span class="toolflowz-stat-label">👨 Hommes</span>
              <span class="toolflowz-stat-value">{{ stats.genderDistribution.male }}</span>
              <span class="toolflowz-stat-percentage">({{ genderPercentages.male.toFixed(1) }}%)</span>
            </div>
            <div class="toolflowz-stat-item">
              <span class="toolflowz-stat-label">👩 Femmes</span>
              <span class="toolflowz-stat-value">{{ stats.genderDistribution.female }}</span>
              <span class="toolflowz-stat-percentage">({{ genderPercentages.female.toFixed(1) }}%)</span>
            </div>
            <div class="toolflowz-stat-item">
              <span class="toolflowz-stat-label">❓ Inconnu</span>
              <span class="toolflowz-stat-value">{{ stats.genderDistribution.unknown }}</span>
              <span class="toolflowz-stat-percentage">({{ genderPercentages.unknown.toFixed(1) }}%)</span>
            </div>
          </div>
        </div>

        <!-- Analyse des sentiments -->
        <div class="toolflowz-stats-card">
          <h4>🎭 Analyse des sentiments</h4>
          <div class="toolflowz-sentiment-grid">
            <!-- Hommes -->
            <div class="toolflowz-sentiment-column">
              <h5>👨 Hommes</h5>
              <div class="toolflowz-sentiment-bars">
                <div class="toolflowz-sentiment-bar">
                  <span class="toolflowz-sentiment-label">😊 Positif</span>
                  <div class="toolflowz-progress-bar">
                    <div 
                      class="toolflowz-progress positive" 
                      :style="{ width: sentimentPercentages.male.positive + '%' }"
                    >
                      {{ sentimentPercentages.male.positive.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolflowz-sentiment-bar">
                  <span class="toolflowz-sentiment-label">😐 Neutre</span>
                  <div class="toolflowz-progress-bar">
                    <div 
                      class="toolflowz-progress neutral" 
                      :style="{ width: sentimentPercentages.male.neutral + '%' }"
                    >
                      {{ sentimentPercentages.male.neutral.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolflowz-sentiment-bar">
                  <span class="toolflowz-sentiment-label">😠 Négatif</span>
                  <div class="toolflowz-progress-bar">
                    <div 
                      class="toolflowz-progress negative" 
                      :style="{ width: sentimentPercentages.male.negative + '%' }"
                    >
                      {{ sentimentPercentages.male.negative.toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Femmes -->
            <div class="toolflowz-sentiment-column">
              <h5>👩 Femmes</h5>
              <div class="toolflowz-sentiment-bars">
                <div class="toolflowz-sentiment-bar">
                  <span class="toolflowz-sentiment-label">😊 Positif</span>
                  <div class="toolflowz-progress-bar">
                    <div 
                      class="toolflowz-progress positive" 
                      :style="{ width: sentimentPercentages.female.positive + '%' }"
                    >
                      {{ sentimentPercentages.female.positive.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolflowz-sentiment-bar">
                  <span class="toolflowz-sentiment-label">😐 Neutre</span>
                  <div class="toolflowz-progress-bar">
                    <div 
                      class="toolflowz-progress neutral" 
                      :style="{ width: sentimentPercentages.female.neutral + '%' }"
                    >
                      {{ sentimentPercentages.female.neutral.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolflowz-sentiment-bar">
                  <span class="toolflowz-sentiment-label">😠 Négatif</span>
                  <div class="toolflowz-progress-bar">
                    <div 
                      class="toolflowz-progress negative" 
                      :style="{ width: sentimentPercentages.female.negative + '%' }"
                    >
                      {{ sentimentPercentages.female.negative.toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des commentaires -->
      <div class="toolflowz-comments-list" v-if="comments.length">
        <h4>💬 Commentaires ({{ comments.length }})</h4>
        <DataTable :value="comments" :scrollable="true" scrollHeight="300px">
          <Column field="text" header="Commentaire">
            <template #body="{ data }">
              <div class="toolflowz-comment-text">{{ data.text }}</div>
            </template>
          </Column>
          <Column field="gender" header="Genre">
            <template #body="{ data }">
              <span class="toolflowz-gender-badge" :class="data.gender">
                {{ genderEmoji[data.gender] }} {{ genderLabel[data.gender] }}
              </span>
            </template>
          </Column>
          <Column field="sentiment" header="Sentiment">
            <template #body="{ data }">
              <span class="toolflowz-sentiment-badge" :class="data.sentiment">
                {{ sentimentEmoji[data.sentiment] }}
              </span>
            </template>
          </Column>
          <Column field="profileUrl" header="Profil">
            <template #body="{ data }">
              <a :href="data.profileUrl" target="_blank" class="toolflowz-profile-link">
                Voir le profil
              </a>
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else-if="!isLoading" class="toolflowz-no-data">
        Cliquez sur "Analyser les commentaires" pour commencer l'analyse.
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSocialAnalysis } from '@/composables/useSocialAnalysis'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const props = defineProps<{
  visible?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const dialogVisible = ref(props.visible)

const {
  comments,
  isLoading,
  stats,
  platform,
  genderPercentages,
  sentimentPercentages,
  analyzeComments,
  exportToCSV
} = useSocialAnalysis()

// Emojis et labels
const platformEmoji = computed(() => {
  switch (platform.value) {
    case 'facebook': return '📘'
    case 'instagram': return '📸'
    case 'twitter': return '🐦'
    case 'linkedin': return '💼'
    default: return '❓'
  }
})

const platformName = computed(() => {
  switch (platform.value) {
    case 'facebook': return 'Facebook'
    case 'instagram': return 'Instagram'
    case 'twitter': return 'Twitter'
    case 'linkedin': return 'LinkedIn'
    default: return 'Plateforme inconnue'
  }
})

const genderEmoji = {
  male: '👨',
  female: '👩',
  unknown: '❓'
}

const genderLabel = {
  male: 'Homme',
  female: 'Femme',
  unknown: 'Inconnu'
}

const sentimentEmoji = {
  positive: '😊',
  neutral: '😐',
  negative: '😠'
}

watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue
})

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})
</script>

<style scoped>
.toolflowz-social-analysis-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.toolflowz-platform-header {
  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
  }
}

.toolflowz-platform-warning {
  color: var(--red-500);
  font-size: 0.9rem;
  font-weight: normal;
}

.toolflowz-social-analysis-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolflowz-stats-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.toolflowz-stats-card {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1.5rem;

  h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }
}

.toolflowz-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.toolflowz-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.toolflowz-stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.toolflowz-stat-percentage {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.toolflowz-sentiment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.toolflowz-sentiment-column {
  h5 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }
}

.toolflowz-sentiment-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolflowz-sentiment-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolflowz-sentiment-label {
  min-width: 100px;
}

.toolflowz-progress-bar {
  flex: 1;
  height: 24px;
  background: var(--surface-card);
  border-radius: 12px;
  overflow: hidden;
}

.toolflowz-progress {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  transition: width 0.3s ease;

  &.positive {
    background: var(--green-500);
  }

  &.neutral {
    background: var(--blue-500);
  }

  &.negative {
    background: var(--red-500);
  }
}

.toolflowz-comments-list {
  h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }
}

.toolflowz-comment-text {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolflowz-gender-badge {
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: 0.9rem;

  &.male {
    background: var(--blue-100);
    color: var(--blue-900);
  }

  &.female {
    background: var(--pink-100);
    color: var(--pink-900);
  }

  &.unknown {
    background: var(--surface-ground);
    color: var(--text-color-secondary);
  }
}

.toolflowz-sentiment-badge {
  font-size: 1.2rem;
}

.toolflowz-profile-link {
  color: var(--primary-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.toolflowz-no-data {
  text-align: center;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
}

:deep(.toolflowz-action-button) {
  background-color: var(--primary-color) !important;
  color: white !important;
  border: none !important;
  padding: 0.75rem 1.25rem !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;

  &:hover {
    filter: brightness(1.1) !important;
    transform: translateY(-1px) !important;
  }

  &:disabled {
    background-color: var(--surface-border) !important;
    color: var(--text-color-secondary) !important;
    cursor: not-allowed !important;
  }
}
</style> 