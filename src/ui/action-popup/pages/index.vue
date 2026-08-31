<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  CONTENT_SCRIPT_STATUS_MESSAGE,
  extensionDetailsUrl,
  isSupportedPageUrl,
  type ContentScriptStatus,
} from '@/utils/contentScriptStatus'

const contentStatus = ref<ContentScriptStatus>('checking')

async function checkContentScript() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab?.id || !isSupportedPageUrl(tab.url)) {
    contentStatus.value = 'unsupported-page'
    return
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: CONTENT_SCRIPT_STATUS_MESSAGE,
    })
    contentStatus.value = response?.ready ? 'available' : 'access-required'
  } catch {
    contentStatus.value = 'access-required'
  }
}

async function openExtensionDetails() {
  await chrome.tabs.create({
    url: extensionDetailsUrl(navigator.userAgent, chrome.runtime.id),
  })
  window.close()
}

onMounted(checkContentScript)
</script>

<template>
  <div>
    <div class="hero">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1>ToolGlows</h1>
          <p>
            Vos outils essentiels, directement dans chaque page web.
          </p>

          <section
            v-if="contentStatus === 'access-required'"
            class="site-access-alert"
            role="alert"
          >
            <strong>ToolGlows n’a pas accès à cette page</strong>
            <p>
              Autorisez l’accès « Sur tous les sites », puis actualisez la page une fois.
            </p>
            <button
              class="btn btn-warning btn-sm"
              type="button"
              @click="openExtensionDetails"
            >
              Gérer l’accès aux sites
            </button>
          </section>

          <section
            v-else-if="contentStatus === 'unsupported-page'"
            class="site-access-note"
          >
            ToolGlows ne peut pas fonctionner sur les pages internes du navigateur.
          </section>

          <div class="flex gap-2 justify-center mb-4">
            <RouterLink
              to="/common/features"
              class="btn btn-primary"
            >
              <i-ph-list-heart />
              Fonctionnalités
            </RouterLink>
            <RouterLink
              to="/common/pricing"
              class="btn btn-primary"
            >
              <i-ph-presentation-chart />
              Offre
            </RouterLink>
          </div>

          <RouterLink
            to="/common/account/login"
            class="btn btn-secondary btn-lg"
          >
            <i-ph-rocket-launch />
            Commencer
          </RouterLink>

          <br />

          <RouterLink
            to="/action-popup/playground"
            class="btn btn-link"
          >
            Tester l'interface
          </RouterLink>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.site-access-alert,
.site-access-note {
  margin: 1rem 0;
  padding: 0.875rem;
  border-radius: 0.75rem;
  text-align: left;
}

.site-access-alert {
  border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 55%, transparent);
  background: color-mix(in srgb, var(--color-warning, #f59e0b) 14%, transparent);
}

.site-access-alert p {
  margin: 0.35rem 0 0.75rem;
}

.site-access-note {
  background: color-mix(in srgb, currentColor 7%, transparent);
  font-size: 0.875rem;
}
</style>
