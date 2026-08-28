<template>
  <Dialog
    v-model:visible="feedStore.isActive"
    :modal="true"
    :header="'Éradicateur de flux'"
    position="right"
    :style="{ width: '350px' }"
    :dismissable-mask="true"
    append-to="body"
    @hide="closeDialog"
  >
    <div class="feed-options">
      <div class="field mb-3">
        <h4>Sites à bloquer</h4>
        <div class="sites-list">
          <div
            v-for="site in feedStore.options.blockedSites"
            :key="site"
            class="site-item"
          >
            <span>{{ site }}</span>
            <Button
              icon="pi pi-times"
              text
              rounded
              @click="removeSite(site)"
            />
          </div>
        </div>
        <div class="add-site">
          <InputText
            v-model="newSite"
            placeholder="example.com"
            @keyup.enter="addSite"
          />
          <Button
            icon="pi pi-plus"
            @click="addSite"
          />
        </div>
      </div>

      <Divider />

      <div class="field mb-3">
        <h4>Contenu de remplacement</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="feedStore.options.showQuotes"
            :binary="true"
            @change="feedStore.saveOptions()"
          />
          <label>Afficher des citations inspirantes</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="feedStore.options.showTasks"
            :binary="true"
            @change="feedStore.saveOptions()"
          />
          <label>Afficher la liste de tâches</label>
        </div>

        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="feedStore.options.showTimer"
            :binary="true"
            @change="feedStore.saveOptions()"
          />
          <label>Afficher un minuteur de productivité</label>
        </div>
      </div>

      <div class="field mb-3">
        <h4>Notifications</h4>
        <div class="field-checkbox mb-2">
          <Checkbox
            v-model="feedStore.options.showNotifications"
            :binary="true"
            @change="feedStore.saveOptions()"
          />
          <label>Afficher les notifications de blocage</label>
        </div>

        <div
          v-if="feedStore.options.showNotifications"
          class="notification-options"
        >
          <div class="field-checkbox mb-2">
            <Checkbox
              v-model="feedStore.options.soundNotifications"
              :binary="true"
              @change="feedStore.saveOptions()"
            />
            <label>Son de notification</label>
          </div>
          
          <div class="notification-duration">
            <label>Durée d'affichage (secondes)</label>
            <InputNumber
              v-model="feedStore.options.notificationDuration"
              :min="1"
              :max="10"
              @change="feedStore.saveOptions()"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFeedEradicatorStore } from '@/stores/feedEradicator'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'

const feedStore = useFeedEradicatorStore()
const newSite = ref('')

const closeDialog = () => {
  feedStore.isActive = false
}

const addSite = () => {
  if (newSite.value && !feedStore.options.blockedSites.includes(newSite.value)) {
    feedStore.options.blockedSites.push(newSite.value)
    feedStore.saveOptions()
    newSite.value = ''
  }
}

const removeSite = (site: string) => {
  const index = feedStore.options.blockedSites.indexOf(site)
  if (index > -1) {
    feedStore.options.blockedSites.splice(index, 1)
    feedStore.saveOptions()
  }
}

onMounted(async () => {
  await feedStore.loadOptions()
})
</script>

<style scoped>
.feed-options {
  padding: var(--tg-space-4);
}

.field {
  margin-bottom: var(--tg-space-4);
}

.field h4 {
  margin-bottom: var(--tg-space-2);
  color: var(--text-color);
}

.sites-list {
  margin-bottom: var(--tg-space-4);
}

.site-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tg-space-2);
  background: var(--surface-hover);
  border-radius: var(--border-radius);
  margin-bottom: var(--tg-space-2);
}

.add-site {
  display: flex;
  gap: var(--tg-space-2);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: var(--tg-space-2);
}

.notification-options {
  margin-top: var(--tg-space-2);
  padding-left: var(--tg-space-5);
}

.notification-duration {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-4);
}
</style> 