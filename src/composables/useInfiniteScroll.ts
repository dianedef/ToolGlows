import { ref } from 'vue'

interface InfiniteScrollOptions {
  threshold: number
  autoLoad: boolean
  showProgress: boolean
  maxPages: number
}

export function useToolGlowsInfiniteScroll() {
  const isEnabled = ref(false)
  const options = ref<InfiniteScrollOptions>({
    threshold: 400,
    autoLoad: true,
    showProgress: true,
    maxPages: 20
  })

  const updateOptions = (newOptions: Partial<InfiniteScrollOptions>) => {
    options.value = { ...options.value, ...newOptions }
  }

  return {
    isEnabled,
    options,
    updateOptions
  }
}
