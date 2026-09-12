export enum ErrorSource {
  COPY = 'copy',
  NAVIGATION = 'navigation'
}

export const useErrorHandling = () => {
  const handleError = (error: Error, source: ErrorSource) => {
    console.error(`[${source}] Error:`, error)
    // TODO: Ajouter une notification ou un toast pour l'utilisateur
  }

  return {
    handleError
  }
}
