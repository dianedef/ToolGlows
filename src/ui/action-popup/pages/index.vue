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
  <div class="popup-home">
    <div class="hero">
      <div class="hero-content text-center">
        <div class="popup-panel max-w-md">
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

          <div class="popup-actions">
            <RouterLink
              to="/common/features"
              class="btn btn-primary"
            >
              <i-ph-list-heart />
              Fonctionnalités
            </RouterLink>
            <RouterLink
              to="/action-popup/playground"
              class="btn btn-secondary"
            >
              <i-ph-sliders-horizontal />
              Tester l’interface
            </RouterLink>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popup-home { padding: var(--tg-space-2); }
.popup-panel {
  width: var(--tg-full-width);
  padding: var(--tg-space-5-half);
  border: 1px solid var(--tg-border-default);
  border-radius: var(--tg-radius-panel);
  background: var(--tg-surface-raised);
  box-shadow: var(--tg-shadow-panel);
}
.popup-panel h1 { margin: 0 0 var(--tg-space-2); }
.popup-panel > p { margin: 0 0 var(--tg-space-5-half); color: var(--tg-text-secondary); }
.site-access-alert,
.site-access-note {
  margin: 0 0 var(--tg-space-4);
  padding: var(--tg-space-4);
  border-radius: var(--tg-radius-section);
  text-align: left;
}

.site-access-alert {
  border: var(--tg-element-outline-width) solid var(--tg-status-warning-border);
  background: var(--tg-status-warning-surface);
}

.site-access-alert p {
  margin: var(--tg-space-1-5) 0 var(--tg-space-3);
}

.site-access-note {
  background: var(--tg-surface-muted);
  font-size: var(--tg-text-base);
}

.popup-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--tg-space-2);
  margin: 0;
}
.popup-actions :deep(.btn) {
  min-height: var(--tg-size-control-comfortable);
  border-radius: var(--tg-radius-control);
}
</style>
