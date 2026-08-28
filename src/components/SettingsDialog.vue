<Dialog
  v-model:visible="visible"
  :modal="true"
  class="toolglows-settings-dialog"
  :style="{ width: '500px' }"
  position="right"
>
  <template #header>
    <div class="dialog-header">
      <ThemeSwatch />
      <h3>{{ t('settings.title') }}</h3>
    </div>
  </template>

  <div class="toolglows-settings-content">
    <!-- ... rest of the content ... -->
  </div>
</Dialog>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import ThemeSwatch from './ThemeSwatch.vue'
// ... rest of the imports ...
</script>

<style scoped>
.toolglows-settings-dialog {
  :deep(.p-dialog-header) {
    padding: var(--tg-space-4);
  }

  .dialog-header {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 40px;

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      flex-grow: 1;
      text-align: center;
      padding: 0 30px; /* Espace pour le swatch */
    }

    :deep(.theme-swatch) {
      position: static; /* Override la position absolute */
      margin-right: var(--tg-space-2);
    }
  }
}
</style>
