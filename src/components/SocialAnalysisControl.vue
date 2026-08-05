<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="'👥 Analyse Sociale'"
    :style="{ width: '70vw' }"
    :breakpoints="{ '960px': '85vw', '641px': '100vw' }"
    :maximizable="true"
    :dismissable-mask="true"
    class="toolglows-social-analysis-dialog"
  >
    <div class="toolglows-social-analysis-content">
      <!-- En-tête avec plateforme -->
      <div class="toolglows-platform-header">
        <h3>
          {{ platformEmoji }} {{ platformName }}
          <span
            v-if="platform === 'unknown'"
            class="toolglows-platform-warning"
          >
            (Plateforme non supportée)
          </span>
        </h3>
      </div>

      <!-- Actions -->
      <div class="toolglows-social-analysis-actions">
        <Button
          icon="pi pi-search"
          label="Analyser les commentaires"
          :loading="isLoading"
          :disabled="platform === 'unknown'"
          class="toolglows-action-button"
          @click="analyzeComments"
        />
        <Button
          icon="pi pi-download"
          label="Exporter en CSV"
          :disabled="!comments.length"
          class="toolglows-action-button"
          @click="exportToCSV"
        />
      </div>

      <!-- Statistiques -->
      <div
        v-if="comments.length"
        class="toolglows-stats-container"
      >
        <!-- Distribution par genre -->
        <div class="toolglows-stats-card">
          <h4>📊 Distribution par genre</h4>
          <div class="toolglows-stats-grid">
            <div class="toolglows-stat-item">
              <span class="toolglows-stat-label">👨 Hommes</span>
              <span class="toolglows-stat-value">{{ stats.genderDistribution.male }}</span>
              <span class="toolglows-stat-percentage">({{ genderPercentages.male.toFixed(1) }}%)</span>
            </div>
            <div class="toolglows-stat-item">
              <span class="toolglows-stat-label">👩 Femmes</span>
              <span class="toolglows-stat-value">{{ stats.genderDistribution.female }}</span>
              <span class="toolglows-stat-percentage">({{ genderPercentages.female.toFixed(1) }}%)</span>
            </div>
            <div class="toolglows-stat-item">
              <span class="toolglows-stat-label">❓ Inconnu</span>
              <span class="toolglows-stat-value">{{ stats.genderDistribution.unknown }}</span>
              <span class="toolglows-stat-percentage">({{ genderPercentages.unknown.toFixed(1) }}%)</span>
            </div>
          </div>
        </div>

        <!-- Analyse des sentiments -->
        <div class="toolglows-stats-card">
          <h4>🎭 Analyse des sentiments</h4>
          <div class="toolglows-sentiment-grid">
            <!-- Hommes -->
            <div class="toolglows-sentiment-column">
              <h5>👨 Hommes</h5>
              <div class="toolglows-sentiment-bars">
                <div class="toolglows-sentiment-bar">
                  <span class="toolglows-sentiment-label">😊 Positif</span>
                  <div class="toolglows-progress-bar">
                    <div
                      class="toolglows-progress positive"
                      :style="{ width: sentimentPercentages.male.positive + '%' }"
                    >
                      {{ sentimentPercentages.male.positive.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolglows-sentiment-bar">
                  <span class="toolglows-sentiment-label">😐 Neutre</span>
                  <div class="toolglows-progress-bar">
                    <div
                      class="toolglows-progress neutral"
                      :style="{ width: sentimentPercentages.male.neutral + '%' }"
                    >
                      {{ sentimentPercentages.male.neutral.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolglows-sentiment-bar">
                  <span class="toolglows-sentiment-label">😠 Négatif</span>
                  <div class="toolglows-progress-bar">
                    <div
                      class="toolglows-progress negative"
                      :style="{ width: sentimentPercentages.male.negative + '%' }"
                    >
                      {{ sentimentPercentages.male.negative.toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Femmes -->
            <div class="toolglows-sentiment-column">
              <h5>👩 Femmes</h5>
              <div class="toolglows-sentiment-bars">
                <div class="toolglows-sentiment-bar">
                  <span class="toolglows-sentiment-label">😊 Positif</span>
                  <div class="toolglows-progress-bar">
                    <div
                      class="toolglows-progress positive"
                      :style="{ width: sentimentPercentages.female.positive + '%' }"
                    >
                      {{ sentimentPercentages.female.positive.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolglows-sentiment-bar">
                  <span class="toolglows-sentiment-label">😐 Neutre</span>
                  <div class="toolglows-progress-bar">
                    <div
                      class="toolglows-progress neutral"
                      :style="{ width: sentimentPercentages.female.neutral + '%' }"
                    >
                      {{ sentimentPercentages.female.neutral.toFixed(1) }}%
                    </div>
                  </div>
                </div>
                <div class="toolglows-sentiment-bar">
                  <span class="toolglows-sentiment-label">😠 Négatif</span>
                  <div class="toolglows-progress-bar">
                    <div
                      class="toolglows-progress negative"
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
      <div
        v-if="comments.length"
        class="toolglows-comments-list"
      >
        <h4>💬 Commentaires ({{ comments.length }})</h4>
        <DataTable
          :value="comments"
          :scrollable="true"
          scroll-height="300px"
        >
          <Column
            field="text"
            header="Commentaire"
          >
            <template #body="{ data }">
              <div class="toolglows-comment-text">{{ data.text }}</div>
            </template>
          </Column>
          <Column
            field="gender"
            header="Genre"
          >
            <template #body="{ data }">
              <span
                class="toolglows-gender-badge"
                :class="data.gender"
              >
                {{ genderEmoji[data.gender] }} {{ genderLabel[data.gender] }}
              </span>
            </template>
          </Column>
          <Column
            field="sentiment"
            header="Sentiment"
          >
            <template #body="{ data }">
              <span
                class="toolglows-sentiment-badge"
                :class="data.sentiment"
              >
                {{ sentimentEmoji[data.sentiment] }}
              </span>
            </template>
          </Column>
          <Column
            field="profileUrl"
            header="Profil"
          >
            <template #body="{ data }">
              <a
                :href="data.profileUrl"
                target="_blank"
                class="toolglows-profile-link"
              >
                Voir le profil
              </a>
            </template>
          </Column>
        </DataTable>
      </div>
      <div
        v-else-if="!isLoading"
        class="toolglows-no-data"
      >
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

const genderEmoji: Record<string, string> = {
  male: '👨',
  female: '👩',
  unknown: '❓'
}

const genderLabel: Record<string, string> = {
  male: 'Homme',
  female: 'Femme',
  unknown: 'Inconnu'
}

const sentimentEmoji: Record<string, string> = {
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
.toolglows-social-analysis-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.toolglows-platform-header {
  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
  }
}

.toolglows-platform-warning {
  color: var(--red-500);
  font-size: 0.9rem;
  font-weight: normal;
}

.toolglows-social-analysis-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolglows-stats-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.toolglows-stats-card {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1.5rem;

  h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }
}

.toolglows-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.toolglows-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.toolglows-stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.toolglows-stat-percentage {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.toolglows-sentiment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.toolglows-sentiment-column {
  h5 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }
}

.toolglows-sentiment-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolglows-sentiment-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolglows-sentiment-label {
  min-width: 100px;
}

.toolglows-progress-bar {
  flex: 1;
  height: 24px;
  background: var(--surface-card);
  border-radius: 12px;
  overflow: hidden;
}

.toolglows-progress {
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

.toolglows-comments-list {
  h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }
}

.toolglows-comment-text {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolglows-gender-badge {
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

.toolglows-sentiment-badge {
  font-size: 1.2rem;
}

.toolglows-profile-link {
  color: var(--primary-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.toolglows-no-data {
  text-align: center;
  padding: 2rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
}

:deep(.toolglows-action-button) {
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
