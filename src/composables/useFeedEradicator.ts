import { ref, watch } from 'vue'

interface SocialNetwork {
  id: string
  name: string
  enabled: boolean
  feedSelector: string
  containerSelector: string
}

interface Quote {
  text: string
  author: string
  category?: string
}

export function useFeedEradicator() {
  // État des réseaux sociaux supportés
  const socialNetworks = ref<SocialNetwork[]>([
    {
      id: 'facebook',
      name: 'Facebook',
      enabled: true,
      feedSelector: '[role="feed"]',
      containerSelector: '[role="main"]'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      enabled: true,
      feedSelector: '[data-testid="primaryColumn"]',
      containerSelector: 'main[role="main"]'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      enabled: true,
      feedSelector: '.core-rail',
      containerSelector: '.core-rail'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      enabled: true,
      feedSelector: 'article',
      containerSelector: 'main[role="main"]'
    }
  ])

  // Citations inspirantes
  const quotes = ref<Quote[]>([
    {
      text: "La vie, ce n'est pas d'attendre que les orages passent, c'est d'apprendre à danser sous la pluie.",
      author: "Sénèque"
    },
    {
      text: "Le succès, c'est d'aller d'échec en échec sans perdre son enthousiasme.",
      author: "Winston Churchill"
    },
    // Ajoutez plus de citations...
  ])

  const currentQuote = ref<Quote>(quotes.value[0])

  // Changer de citation
  const changeQuote = () => {
    const index = Math.floor(Math.random() * quotes.value.length)
    currentQuote.value = quotes.value[index]
  }

  // Créer l'élément de remplacement
  const createReplacementElement = () => {
    const container = document.createElement('div')
    container.className = 'feed-eradicator'
    container.innerHTML = `
      <div class="quote-container">
        <blockquote>
          <p>${currentQuote.value.text}</p>
          <footer>— ${currentQuote.value.author}</footer>
        </blockquote>
        <button class="new-quote-btn">Nouvelle citation</button>
      </div>
    `

    container.querySelector('.new-quote-btn')?.addEventListener('click', changeQuote)
    return container
  }

  // Appliquer l'éradication
  const applyEradication = () => {
    socialNetworks.value.forEach(network => {
      if (!network.enabled) return

      const feedElement = document.querySelector(network.feedSelector)
      const containerElement = document.querySelector(network.containerSelector)

      if (feedElement && containerElement) {
        // Cacher le feed
        feedElement.style.display = 'none'

        // Insérer notre élément
        const replacementElement = createReplacementElement()
        if (!containerElement.querySelector('.feed-eradicator')) {
          containerElement.appendChild(replacementElement)
        }
      }
    })
  }

  // Observer les changements du DOM
  const initObserver = () => {
    const observer = new MutationObserver(() => {
      applyEradication()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return observer
  }

  // Initialisation
  const init = () => {
    const styles = document.createElement('style')
    styles.textContent = `
      .feed-eradicator {
        padding: 2rem;
        text-align: center;
        background: #f8f9fa;
        border-radius: 8px;
        margin: 1rem;
      }

      .quote-container {
        max-width: 600px;
        margin: 0 auto;
      }

      .feed-eradicator blockquote {
        font-size: 1.5rem;
        line-height: 1.6;
        margin-bottom: 1rem;
        color: #2c3e50;
      }

      .feed-eradicator footer {
        font-style: italic;
        color: #666;
      }

      .new-quote-btn {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        border: none;
        background: #4CAF50;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.3s;
      }

      .new-quote-btn:hover {
        background: #45a049;
      }
    `
    document.head.appendChild(styles)

    applyEradication()
    const observer = initObserver()

    // Changer la citation périodiquement
    const quoteInterval = setInterval(changeQuote, 300000) // 5 minutes

    return () => {
      observer.disconnect()
      clearInterval(quoteInterval)
      document.querySelectorAll('.feed-eradicator').forEach(el => el.remove())
    }
  }

  // Toggle un réseau social
  const toggleNetwork = (networkId: string) => {
    const network = socialNetworks.value.find(n => n.id === networkId)
    if (network) {
      network.enabled = !network.enabled
      applyEradication()
    }
  }

  return {
    socialNetworks,
    currentQuote,
    init,
    toggleNetwork,
    changeQuote
  }
} 