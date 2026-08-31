import { ref, computed } from 'vue'
import { resolveDesignToken } from '@/utils/designTokens'

interface Reel {
  id: string
  url: string
  thumbnail: string
  savedAt: Date
  tags: string[]
  duration: number
  author: string
}

interface Folder {
  id: string
  name: string
  color: string
  reels: Reel[]
}

export function useInstagramSavedLibrary() {
  const reels = ref<Reel[]>([])
  const folders = ref<Folder[]>([
    { 
      id: 'default', 
      name: 'Non classé', 
      color: resolveDesignToken('--tg-color-folder-default'),
      reels: [] 
    }
  ])

  const currentFolder = ref<string>('default')
  const searchQuery = ref<string>('')
  const selectedReels = ref<string[]>([])

  // Créer un nouveau dossier
  const createFolder = (name: string, color: string = resolveDesignToken('--tg-color-folder-default')) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      color,
      reels: []
    }
    folders.value.push(newFolder)
  }

  // Ajouter un reel à un dossier
  const addReelToFolder = (reelId: string, folderId: string) => {
    const reel = reels.value.find(r => r.id === reelId)
    const folder = folders.value.find(f => f.id === folderId)

    if (reel && folder && !folder.reels.some(r => r.id === reelId)) {
      folder.reels.push(reel)
    }
  }

  // Supprimer un reel d'un dossier
  const removeReelFromFolder = (reelId: string, folderId: string) => {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      folder.reels = folder.reels.filter(r => r.id !== reelId)
    }
  }

  // Filtrer les reels
  const filteredReels = computed(() => {
    const currentFolderReels = folders.value
      .find(f => f.id === currentFolder.value)?.reels || []

    return currentFolderReels.filter(reel => 
      reel.author.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      reel.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    )
  })

  // Sauvegarder un reel depuis Instagram
  const saveReelFromInstagram = (reelUrl: string) => {
    const newReel: Reel = {
      id: Date.now().toString(),
      url: reelUrl,
      thumbnail: '', // À implémenter avec l'extraction de la miniature
      savedAt: new Date(),
      tags: [],
      duration: 0,
      author: '' // À implémenter avec l'extraction des métadonnées
    }

    reels.value.push(newReel)
    addReelToFolder(newReel.id, 'default')
  }

  // Sélectionner/désélectionner un reel
  const toggleReelSelection = (reelId: string) => {
    if (selectedReels.value.includes(reelId)) {
      selectedReels.value = selectedReels.value.filter(id => id !== reelId)
    } else {
      selectedReels.value.push(reelId)
    }
  }

  // Déplacer les reels sélectionnés vers un dossier
  const moveSelectedReels = (targetFolderId: string) => {
    selectedReels.value.forEach(reelId => {
      addReelToFolder(reelId, targetFolderId)
    })
    selectedReels.value = []
  }

  return {
    reels,
    folders,
    currentFolder,
    searchQuery,
    selectedReels,
    filteredReels,
    createFolder,
    addReelToFolder,
    removeReelFromFolder,
    saveReelFromInstagram,
    toggleReelSelection,
    moveSelectedReels
  }
}
