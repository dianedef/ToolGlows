<template>
  <ToolGlowsDialog
    v-if="!isLoading"
    v-model:visible="dialogVisible"
    :dismissable-mask="!readerModeStore.isParsing"
    header="Mode lecture"
    position="right"
    :style="{ width: '350px' }"
    :pt="{ root: { class: 'toolglows-reader-dialog', 'data-toolglows-ui': 'true' } }"
    @hide="closeDialog"
  >
    <div class="toolglows-reader-options">
      <section aria-labelledby="reader-state-heading">
        <h4 id="reader-state-heading">Lecture</h4>
        <p class="toolglows-reader-help">
          Isole l’article sans modifier la page d’origine. Échap permet de quitter à tout moment.
        </p>
        <Button
          v-if="!readerModeStore.isActive"
          label="Ouvrir le mode lecture"
          icon="pi pi-book"
          :loading="readerModeStore.isParsing"
          class="toolglows-reader-primary"
          @click="activateReader"
        />
        <Button
          v-else
          label="Quitter le mode lecture"
          icon="pi pi-times"
          severity="secondary"
          class="toolglows-reader-primary"
          @click="deactivateReader"
        />
        <p
          v-if="readerModeStore.errorMessage"
          class="toolglows-reader-error"
          role="alert"
        >
          {{ readerModeStore.errorMessage }}
        </p>
      </section>

      <Divider />

      <section aria-labelledby="reader-appearance-heading">
        <h4 id="reader-appearance-heading">Apparence</h4>

        <div class="toolglows-field">
          <label for="reader-font-family">Police</label>
          <Dropdown
            input-id="reader-font-family"
            :model-value="readerModeStore.options.fontFamily"
            :options="fontOptions"
            option-label="label"
            option-value="value"
            @update:model-value="updateOption('fontFamily', $event)"
          />
        </div>

        <div class="toolglows-field">
          <div class="toolglows-reader-setting-label">
            <label>Taille du texte</label>
            <output>{{ readerModeStore.options.fontSize }} px</output>
          </div>
          <Slider
            :model-value="readerModeStore.options.fontSize"
            :min="14"
            :max="28"
            aria-label="Taille du texte"
            @change="updateOption('fontSize', $event)"
          />
        </div>

        <div class="toolglows-field">
          <div class="toolglows-reader-setting-label">
            <label>Hauteur de ligne</label>
            <output>{{ readerModeStore.options.lineHeight.toFixed(1) }}</output>
          </div>
          <Slider
            :model-value="readerModeStore.options.lineHeight"
            :min="1.2"
            :max="2.2"
            :step="0.1"
            aria-label="Hauteur de ligne"
            @change="updateOption('lineHeight', $event)"
          />
        </div>

        <div class="toolglows-field">
          <div class="toolglows-reader-setting-label">
            <label>Largeur du texte</label>
            <output>{{ readerModeStore.options.maxWidth }} px</output>
          </div>
          <Slider
            :model-value="readerModeStore.options.maxWidth"
            :min="480"
            :max="1200"
            :step="40"
            aria-label="Largeur du texte"
            @change="updateOption('maxWidth', $event)"
          />
        </div>
      </section>

      <section aria-labelledby="reader-theme-heading">
        <h4 id="reader-theme-heading">Thème</h4>
        <div class="toolglows-reader-themes">
          <label
            v-for="theme in themeOptions"
            :key="theme.value"
            class="toolglows-reader-choice"
          >
            <RadioButton
              :model-value="readerModeStore.options.theme"
              :value="theme.value"
              name="reader-theme"
              @update:model-value="updateOption('theme', $event)"
            />
            <span>{{ theme.label }}</span>
          </label>
        </div>
      </section>

      <section aria-labelledby="reader-content-heading">
        <h4 id="reader-content-heading">Contenu</h4>
        <label class="toolglows-reader-choice">
          <Checkbox
            :model-value="readerModeStore.options.showImages"
            :binary="true"
            input-id="reader-show-images"
            @update:model-value="updateOption('showImages', $event)"
          />
          <span>Afficher les images</span>
        </label>
        <label class="toolglows-reader-choice">
          <Checkbox
            :model-value="readerModeStore.options.showLinks"
            :binary="true"
            input-id="reader-show-links"
            @update:model-value="updateOption('showLinks', $event)"
          />
          <span>Afficher les adresses des liens</span>
        </label>
      </section>
    </div>
  </ToolGlowsDialog>

  <Teleport to="#toolglows-root">
    <section
      v-if="readerModeStore.isActive && readerModeStore.article"
      ref="readerSurface"
      class="toolglows-reader-surface"
      :class="`toolglows-reader-theme-${readerModeStore.options.theme}`"
      :style="readerStyle"
      :dir="readerModeStore.article.dir"
      :lang="readerModeStore.article.lang || undefined"
      role="dialog"
      aria-modal="true"
      aria-labelledby="toolglows-reader-title"
      data-toolglows-reader
      tabindex="-1"
      @keydown="handleReaderKeydown"
    >
      <header class="toolglows-reader-header">
        <span class="toolglows-reader-brand">ToolGlows · Lecture</span>
        <Button
          ref="exitButton"
          label="Quitter"
          icon="pi pi-times"
          severity="secondary"
          aria-label="Quitter le mode lecture et restaurer la page"
          @click="deactivateReader"
        />
      </header>
      <main
        class="toolglows-reader-main"
        tabindex="-1"
      >
        <article class="toolglows-reader-article">
          <h1 id="toolglows-reader-title">{{ readerModeStore.article.title }}</h1>
          <p
            v-if="readerModeStore.article.byline"
            class="toolglows-reader-byline"
          >
            {{ readerModeStore.article.byline }}
          </p>
          <div
            ref="articleContent"
            class="toolglows-reader-content"
          />
        </article>
      </main>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import RadioButton from 'primevue/radiobutton'
import Slider from 'primevue/slider'
import ToolGlowsDialog from './ToolGlowsDialog.vue'
import { useReaderModeStore } from '@/stores/readerMode'
import type { ReaderFontFamily, ReaderModeOptions, ReaderTheme } from '@/composables/useReaderMode'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>()

const readerModeStore = useReaderModeStore()
const isLoading = ref(true)
const articleContent = ref<HTMLElement | null>(null)
const readerSurface = ref<HTMLElement | null>(null)
const exitButton = ref<{ $el?: HTMLElement } | null>(null)

const fontOptions: Array<{ label: string; value: ReaderFontFamily }> = [
  { label: 'Système', value: 'system-ui' },
  { label: 'Avec empattements', value: 'serif' },
  { label: 'Sans empattements', value: 'sans-serif' },
]
const themeOptions: Array<{ label: string; value: ReaderTheme }> = [
  { label: 'Clair', value: 'light' },
  { label: 'Sépia', value: 'sepia' },
  { label: 'Sombre', value: 'dark' },
]

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const readerStyle = computed(() => ({
  '--tg-reader-font-family': readerModeStore.options.fontFamily,
  '--tg-reader-font-size': `${readerModeStore.options.fontSize}px`,
  '--tg-reader-line-height': String(readerModeStore.options.lineHeight),
  '--tg-reader-max-width': `${readerModeStore.options.maxWidth}px`,
}))

const updateOption = <Key extends keyof ReaderModeOptions>(
  key: Key,
  value: ReaderModeOptions[Key] | undefined,
) => {
  if (value !== undefined) void readerModeStore.updateOptions({ [key]: value })
}

const renderArticle = async () => {
  await nextTick()
  if (!articleContent.value || !readerModeStore.article) return
  articleContent.value.replaceChildren(readerModeStore.article.content.cloneNode(true))
}

const activateReader = async () => {
  const activated = await readerModeStore.activate()
  if (!activated) return
  dialogVisible.value = false
  await renderArticle()
  await nextTick()
  ;(exitButton.value?.$el ?? readerSurface.value)?.focus()
}

const deactivateReader = async () => {
  readerModeStore.deactivate()
  await nextTick()
  document.querySelector<HTMLElement>('[data-toolglows-main]')?.focus({ preventScroll: true })
}

const handleReaderKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    await deactivateReader()
    return
  }
  if (event.key !== 'Tab' || !readerSurface.value) return

  const focusable = Array.from(readerSurface.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ))
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const closeDialog = () => {
  dialogVisible.value = false
}

watch(
  () => readerModeStore.article,
  () => void renderArticle(),
)

onMounted(async () => {
  await readerModeStore.loadOptions()
  isLoading.value = false
  if (readerModeStore.isActive) await renderArticle()
})

onBeforeUnmount(() => readerModeStore.deactivate())
</script>

<style scoped>
.toolglows-reader-options {
  display: grid;
  gap: var(--tg-space-4);
  padding: var(--tg-space-4);
}

.toolglows-reader-options section,
.toolglows-field {
  display: grid;
  gap: var(--tg-space-2);
}

.toolglows-reader-options h4 {
  color: var(--tg-text-primary);
}

.toolglows-reader-help,
.toolglows-reader-setting-label output {
  color: var(--tg-text-secondary);
  line-height: var(--tg-line-height-copy);
}

.toolglows-reader-primary {
  width: var(--tg-full-width);
}

.toolglows-reader-error {
  padding: var(--tg-space-3);
  border: 1px solid var(--red-500);
  border-radius: var(--tg-radius-control);
  color: var(--red-500);
}

.toolglows-reader-setting-label,
.toolglows-reader-choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-3);
}

.toolglows-reader-choice {
  justify-content: flex-start;
  min-height: var(--tg-size-control-comfortable);
  cursor: pointer;
}

.toolglows-reader-themes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--tg-space-2);
}

.toolglows-reader-surface {
  position: fixed;
  inset: 0;
  z-index: var(--tg-z-overlay);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  background: var(--tg-reader-surface);
  color: var(--tg-reader-text);
  font-family: var(--tg-reader-font-family);
  font-size: var(--tg-reader-font-size);
  line-height: var(--tg-reader-line-height);
  text-align: start;
}

:global(#toolglows-root .toolglows-reader-surface),
:global(#toolglows-root .toolglows-reader-surface *) {
  box-sizing: border-box !important;
  font-family: var(--tg-reader-font-family) !important;
}

.toolglows-reader-theme-light {
  --tg-reader-surface: var(--tg-reader-light-surface);
  --tg-reader-text: var(--tg-reader-light-text);
  --tg-reader-muted: var(--tg-reader-light-muted);
  --tg-reader-link: var(--tg-reader-light-link);
  --tg-reader-border: var(--tg-reader-light-border);
}

.toolglows-reader-theme-sepia {
  --tg-reader-surface: var(--tg-reader-sepia-surface);
  --tg-reader-text: var(--tg-reader-sepia-text);
  --tg-reader-muted: var(--tg-reader-sepia-muted);
  --tg-reader-link: var(--tg-reader-sepia-link);
  --tg-reader-border: var(--tg-reader-sepia-border);
}

.toolglows-reader-theme-dark {
  --tg-reader-surface: var(--tg-reader-dark-surface);
  --tg-reader-text: var(--tg-reader-dark-text);
  --tg-reader-muted: var(--tg-reader-dark-muted);
  --tg-reader-link: var(--tg-reader-dark-link);
  --tg-reader-border: var(--tg-reader-dark-border);
}

.toolglows-reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tg-space-4);
  padding: var(--tg-space-3) var(--tg-space-5);
  border-bottom: 1px solid var(--tg-reader-border);
  background: var(--tg-reader-surface);
}

:global(#toolglows-root .toolglows-reader-header) {
  padding: var(--tg-space-3) var(--tg-space-5) !important;
}

.toolglows-reader-brand,
.toolglows-reader-byline {
  color: var(--tg-reader-muted);
}

.toolglows-reader-main {
  overflow: auto;
  overscroll-behavior: contain;
}

.toolglows-reader-article {
  width: min(calc(100% - (2 * var(--tg-space-6))), var(--tg-reader-max-width));
  margin: 0 auto;
  padding: var(--tg-space-6) 0;
}

:global(#toolglows-root .toolglows-reader-article) {
  margin: 0 auto !important;
  padding: var(--tg-space-6) 0 !important;
}

.toolglows-reader-article h1 {
  margin-block: 0 var(--tg-space-3);
  font-size: var(--tg-reader-title-scale);
  line-height: var(--tg-line-height-copy);
}

:global(#toolglows-root .toolglows-reader-article h1) {
  margin-block: 0 var(--tg-space-3) !important;
  font-size: var(--tg-reader-title-scale) !important;
  line-height: var(--tg-line-height-copy) !important;
}

.toolglows-reader-byline {
  margin-block-end: var(--tg-space-6);
}

:global(#toolglows-root .toolglows-reader-byline) {
  margin-block-end: var(--tg-space-6) !important;
}

.toolglows-reader-content :deep(*) {
  max-width: var(--tg-full-width);
}

.toolglows-reader-content :deep(p),
.toolglows-reader-content :deep(ul),
.toolglows-reader-content :deep(ol),
.toolglows-reader-content :deep(blockquote),
.toolglows-reader-content :deep(figure),
.toolglows-reader-content :deep(table),
.toolglows-reader-content :deep(pre) {
  margin-block: 0 var(--tg-space-5);
}

:global(#toolglows-root .toolglows-reader-content p),
:global(#toolglows-root .toolglows-reader-content ul),
:global(#toolglows-root .toolglows-reader-content ol),
:global(#toolglows-root .toolglows-reader-content blockquote),
:global(#toolglows-root .toolglows-reader-content figure),
:global(#toolglows-root .toolglows-reader-content table),
:global(#toolglows-root .toolglows-reader-content pre) {
  margin-block: 0 var(--tg-space-5) !important;
}

.toolglows-reader-content :deep(h2),
.toolglows-reader-content :deep(h3),
.toolglows-reader-content :deep(h4),
.toolglows-reader-content :deep(h5),
.toolglows-reader-content :deep(h6) {
  margin-block: var(--tg-space-6) var(--tg-space-3);
  line-height: var(--tg-line-height-copy);
}

:global(#toolglows-root .toolglows-reader-content h2),
:global(#toolglows-root .toolglows-reader-content h3),
:global(#toolglows-root .toolglows-reader-content h4),
:global(#toolglows-root .toolglows-reader-content h5),
:global(#toolglows-root .toolglows-reader-content h6) {
  margin-block: var(--tg-space-6) var(--tg-space-3) !important;
  line-height: var(--tg-line-height-copy) !important;
}

.toolglows-reader-content :deep(a) {
  color: var(--tg-reader-link);
  text-decoration: underline;
  overflow-wrap: anywhere;
}

.toolglows-reader-content :deep(a[data-reader-url]::after) {
  content: ' (' attr(data-reader-url) ')';
  color: var(--tg-reader-muted);
  font-size: var(--tg-reader-url-scale);
}

.toolglows-reader-content :deep(img) {
  display: block;
  height: auto;
  margin: var(--tg-space-5) auto;
  border-radius: var(--tg-radius-control);
}

:global(#toolglows-root .toolglows-reader-content img) {
  margin: var(--tg-space-5) auto !important;
}

.toolglows-reader-content :deep(blockquote) {
  padding-inline-start: var(--tg-space-5);
  border-inline-start: var(--tg-space-1) solid var(--tg-reader-border);
  color: var(--tg-reader-muted);
}

:global(#toolglows-root .toolglows-reader-content blockquote) {
  padding-inline-start: var(--tg-space-5) !important;
}

.toolglows-reader-content :deep(pre),
.toolglows-reader-content :deep(table) {
  overflow: auto;
}

.toolglows-reader-content :deep(:focus-visible),
.toolglows-reader-surface :deep(:focus-visible) {
  outline: var(--tg-element-outline-width) solid var(--tg-action);
  outline-offset: var(--tg-space-1);
}

@media (prefers-reduced-motion: reduce) {
  .toolglows-reader-surface,
  .toolglows-reader-surface * {
    scroll-behavior: auto !important;
    transition-duration: var(--tg-motion-reduced) !important;
  }
}
</style>
