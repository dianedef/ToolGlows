/**
 * Instant OCR Composable
 *
 * Provides real-time optical character recognition for images on web pages.
 * Uses Tesseract.js to extract text from images near the cursor for instant
 * copy/paste functionality.
 *
 * Key features:
 * - Predictive preloading: OCRs images near mouse cursor before click
 * - Caching: Avoids re-processing same images
 * - Selectable overlays: Makes recognized text directly selectable on page
 * - Multi-language support: Can detect multiple languages simultaneously
 *
 * Performance considerations:
 * - Tesseract.js runs in WebAssembly for near-native speed
 * - Worker-based to avoid blocking UI thread
 * - Configurable preload radius and delay to balance speed vs resources
 *
 * Use cases:
 * - Copying text from screenshots or scanned documents
 * - Extracting text from image-based PDFs
 * - Making memes and infographics searchable/copyable
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { createWorker } from 'tesseract.js'
import type { Worker } from 'tesseract.js'

interface OCROptions {
  enabled: boolean
  preloadRadius: number // Pixels around cursor to trigger preload
  preloadDelay: number // Debounce delay before starting OCR (ms)
  languages: string[] // Tesseract language codes (e.g., 'eng', 'fra')
  confidence: number // Minimum confidence threshold (0-100)
  showOverlay: boolean // Display selectable text overlay on images
}

interface OCRResult {
  imageUrl: string
  text: string
  boxes: Array<{
    text: string
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
  confidence: number
}

interface OCRWord {
  text: string
  confidence: number
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export function useInstantOCR() {
  const options = ref<OCROptions>({
    enabled: true,
    preloadRadius: 500,
    preloadDelay: 500,
    languages: ['eng', 'fra'],
    confidence: 70,
    showOverlay: true
  })

  const cache = ref<Map<string, OCRResult>>(new Map())
  const worker = ref<Worker | null>(null)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const mousePosition = ref({ x: 0, y: 0 })

  /**
   * Initialize Tesseract.js Worker
   *
   * Creates and configures a WebAssembly-based OCR worker.
   * Worker initialization is expensive (downloads ~2MB of language data)
   * so this should only be called once and the worker reused.
   *
   * Language format: Use + to combine languages (e.g., 'fra+eng' for French and English)
   * This enables better accuracy for multilingual content.
   */
  const initWorker = async () => {
    try {
      const newWorker = await createWorker()

      // @ts-expect-error - Les types de Tesseract.js sont incomplets
      await newWorker.loadLanguage('fra+eng')
      // @ts-expect-error - Les types de Tesseract.js sont incomplets
      await newWorker.initialize('fra+eng')

      worker.value = newWorker
    } catch (e) {
      console.error('ERROR: Error during OCR worker initialization:', e)
      error.value = e instanceof Error ? e.message : 'OCR worker initialization failed'
    }
  }

  /**
   * Proximity Check for Predictive Preloading
   *
   * Calculates Euclidean distance between cursor and image center.
   * If within configured radius, triggers OCR preloading.
   *
   * Why center-based: User typically clicks near image center,
   * so this provides best prediction of interaction likelihood.
   */
  const isImageInRadius = (img: HTMLImageElement): boolean => {
    const rect = img.getBoundingClientRect()
    const imgCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }

    const distance = Math.sqrt(
      Math.pow(mousePosition.value.x - imgCenter.x, 2) +
      Math.pow(mousePosition.value.y - imgCenter.y, 2)
    )

    return distance <= options.value.preloadRadius
  }

  // Précharger l'OCR d'une image
  const preloadImageOCR = async (img: HTMLImageElement) => {
    if (!options.value.enabled || !worker.value) {
      console.log('INFO: OCR disabled or worker not initialized')
      return
    }
    if (cache.value.has(img.src)) {
      return
    }
    if (isProcessing.value) {
      return
    }

    try {
      isProcessing.value = true

      const result = await worker.value.recognize(img)

      if (!result?.data?.text) {
        throw new Error('Aucun texte détecté')
      }

      const text = result.data.text
      const confidence = result.data.confidence || 0

      // Simplifier la détection des boîtes
      const boxes = text.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => ({
          text: line,
          bbox: { x0: 0, y0: 0, x1: 0, y1: 0 }
        }))

      cache.value.set(img.src, {
        imageUrl: img.src,
        text,
        boxes,
        confidence
      })

      console.log('INFO: OCR finished:', { text, confidence })

      if (options.value.showOverlay) {
        createTextOverlay(img, boxes)
      }

    } catch (err) {
      console.error('ERROR: Erreur OCR:', err)
      error.value = err instanceof Error ? err.message : 'Échec du traitement OCR'
    } finally {
      isProcessing.value = false
    }
  }

  // Créer un overlay de texte sélectionnable
  const createTextOverlay = (img: HTMLImageElement, boxes: any[]) => {
    const overlay = document.createElement('div')
    overlay.className = 'ocr-overlay'
    overlay.style.position = 'absolute'
    overlay.style.left = `${img.offsetLeft}px`
    overlay.style.top = `${img.offsetTop}px`
    overlay.style.width = `${img.width}px`
    overlay.style.height = `${img.height}px`

    boxes.forEach(box => {
      const span = document.createElement('span')
      span.textContent = box.text
      span.style.position = 'absolute'
      span.style.left = `${(box.bbox.x0 / img.naturalWidth) * 100}%`
      span.style.top = `${(box.bbox.y0 / img.naturalHeight) * 100}%`
      span.style.width = `${((box.bbox.x1 - box.bbox.x0) / img.naturalWidth) * 100}%`
      span.style.height = `${((box.bbox.y1 - box.bbox.y0) / img.naturalHeight) * 100}%`
      overlay.appendChild(span)
    })

    img.parentElement?.appendChild(overlay)
  }

  // Gérer le mouvement de la souris
  const handleMouseMove = (event: MouseEvent) => {
    mousePosition.value = {
      x: event.clientX,
      y: event.clientY
    }

    // Trouver les images dans le rayon
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (isImageInRadius(img)) {
        setTimeout(() => {
          preloadImageOCR(img)
        }, options.value.preloadDelay)
      }
    })
  }

  // Initialisation
  const init = async () => {
    await initWorker()
    document.addEventListener('mousemove', handleMouseMove)

    // Ajouter les styles pour l'overlay
    const style = document.createElement('style')
    style.textContent = `
      .ocr-overlay {
        pointer-events: none;
        user-select: text;
        z-index: 9999;
      }
      .ocr-overlay span {
        position: absolute;
        background: rgba(255, 255, 0, 0.2);
        mix-blend-mode: multiply;
        cursor: text;
        pointer-events: auto;
      }
      .ocr-overlay span:hover {
        background: rgba(255, 255, 0, 0.4);
      }
    `
    document.head.appendChild(style)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      worker.value?.terminate()
      document.querySelectorAll('.ocr-overlay').forEach(el => el.remove())
    }
  }

  return {
    options,
    cache,
    isProcessing,
    error,
    init
  }
}
