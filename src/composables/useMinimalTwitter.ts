import { ref, watch } from 'vue'

interface MinimalThemeOptions {
  removePromoted: boolean
  removeViewCounts: boolean
  removeTimelineTabs: boolean
  removeTrends: boolean
  customTimelineWidth: 'default' | 'narrow' | 'wide'
  removeBorders: boolean
  hideVanityCounts: boolean
  hideSearchBar: boolean
  hideTweetButton: boolean
  hideExplore: boolean
  hideNotifications: boolean
  hideTrends: boolean
  hideWhoToFollow: boolean
  centerTimeline: boolean
  hideMetrics: boolean
  timelineWidth: number
  navigationItems: {
    home: boolean
    explore: boolean
    notifications: boolean
    messages: boolean
    bookmarks: boolean
    premium: boolean
    profile: boolean
    grok: boolean
  }
}

export function useMinimalTwitter() {
  const isEnabled = ref(false)
  const options = ref<MinimalThemeOptions>({
    removePromoted: true,
    removeViewCounts: true,
    removeTimelineTabs: true,
    removeTrends: true,
    customTimelineWidth: 'default',
    removeBorders: false,
    hideVanityCounts: false,
    hideSearchBar: false,
    hideTweetButton: false,
    hideExplore: false,
    hideNotifications: false,
    hideTrends: true,
    hideWhoToFollow: true,
    centerTimeline: false,
    hideMetrics: false,
    timelineWidth: 600,
    navigationItems: {
      home: true,
      explore: true,
      notifications: true,
      messages: true,
      bookmarks: true,
      premium: false,
      profile: true,
      grok: false
    }
  })

  // Appliquer les styles minimalistes
  const applyMinimalStyles = () => {
    if (!isEnabled.value) return

    const style = document.createElement('style')
    style.id = 'minimal-twitter-styles'

    const styles = `
      /* Masquer les posts sponsorisés */
      ${options.value.removePromoted ? `
        [data-testid="promotedTweet"],
        [data-testid="placementTracking"],
        article:has([data-testid="promoted"]) {
          display: none !important;
        }
      ` : ''}

      /* Masquer les compteurs de vues */
      ${options.value.removeViewCounts ? `
        [data-testid="analyticsButton"],
        [data-testid="viewCount"] {
          display: none !important;
        }
      ` : ''}

      /* Masquer les onglets de timeline */
      ${options.value.removeTimelineTabs ? `
        [role="tablist"],
        [data-testid="ScrollSnap-List"] {
          display: none !important;
        }
      ` : ''}

      /* Masquer la barre de tendances */
      ${options.value.removeTrends || options.value.hideTrends ? `
        [data-testid="sidebarColumn"],
        [data-testid="trend"] {
          display: none !important;
        }
      ` : ''}

      /* Masquer des éléments de navigation courants */
      ${options.value.hideExplore ? `
        [data-testid="AppTabBar_Explore_Link"] {
          display: none !important;
        }
      ` : ''}

      ${options.value.hideNotifications ? `
        [data-testid="AppTabBar_Notifications_Link"] {
          display: none !important;
        }
      ` : ''}

      ${options.value.hideWhoToFollow ? `
        [data-testid="UserCell"] {
          display: none !important;
        }
      ` : ''}

      /* Ajuster la largeur du timeline */
      ${options.value.customTimelineWidth !== 'default' || options.value.centerTimeline ? `
        [data-testid="primaryColumn"] {
          max-width: ${options.value.centerTimeline ? `${options.value.timelineWidth}px` : options.value.customTimelineWidth === 'narrow' ? '600px' : '1000px'} !important;
          margin: 0 auto !important;
        }
      ` : ''}

      /* Supprimer les bordures */
      ${options.value.removeBorders ? `
        article {
          border: none !important;
        }
        [data-testid="cellInnerDiv"] {
          border-bottom: none !important;
        }
      ` : ''}

      /* Masquer les compteurs de vanité */
      ${options.value.hideVanityCounts || options.value.hideMetrics ? `
        [data-testid="like"],
        [data-testid="retweet"],
        [data-testid="reply"] {
          span {
            display: none !important;
          }
        }
      ` : ''}

      /* Masquer la barre de recherche */
      ${options.value.hideSearchBar ? `
        [data-testid="SearchBox_Search_Input"] {
          display: none !important;
        }
      ` : ''}

      /* Masquer le bouton Tweet */
      ${options.value.hideTweetButton ? `
        [data-testid="tweetButton"],
        [data-testid="tweetButtonInline"] {
          display: none !important;
        }
      ` : ''}

      /* Gérer les éléments de navigation */
      ${Object.entries(options.value.navigationItems).map(([key, visible]) => !visible ? `
        [data-testid="AppTabBar_${key}_Link"],
        [aria-label="${key}"] {
          display: none !important;
        }
      ` : '').join('\n')}
    `

    style.textContent = styles
    document.head.appendChild(style)
  }

  // Observer les changements du DOM
  const initObserver = () => {
    const observer = new MutationObserver(() => {
      if (isEnabled.value) {
        applyMinimalStyles()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return observer
  }

  // Initialisation
  const init = () => {
    if (!window.location.hostname.includes('twitter.com') &&
        !window.location.hostname.includes('x.com')) return

    applyMinimalStyles()
    const observer = initObserver()

    return () => {
      observer.disconnect()
      document.getElementById('minimal-twitter-styles')?.remove()
    }
  }

  // Surveiller les changements d'options
  watch([isEnabled, options], () => {
    applyMinimalStyles()
  })

  return {
    isEnabled,
    options,
    init
  }
}
