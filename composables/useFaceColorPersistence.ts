import type { ProcessedStepModel } from '~/types/step-model'

interface SavedFaceColorMap {
  [faceId: string]: [number, number, number]
}

interface SavedColorPayload {
  sourceName: string
  faceColors: SavedFaceColorMap
  savedAt: string
}

const STORAGE_PREFIX = 'step-tool-face-colors'

export const useFaceColorPersistence = () => {
  const lastSavedAt = useState<string | null>('face-color-last-saved-at', () => null)

  const buildStorageKey = (sourceName: string): string => {
    return `${STORAGE_PREFIX}:${sourceName}`
  }

  const saveModelFaceColors = (model: ProcessedStepModel): void => {
    if (!import.meta.client) {
      return
    }

    const faceColors: SavedFaceColorMap = {}

    model.meshes.forEach((processedMesh) => {
      processedMesh.faceMappings.forEach((mapping) => {
        if (mapping.color) {
          faceColors[mapping.id] = [...mapping.color]
        }
      })
    })

    const payload: SavedColorPayload = {
      sourceName: model.sourceName,
      faceColors,
      savedAt: new Date().toISOString()
    }

    window.localStorage.setItem(buildStorageKey(model.sourceName), JSON.stringify(payload))
    lastSavedAt.value = payload.savedAt
  }

  const loadSavedFaceColors = (sourceName: string): SavedFaceColorMap => {
    if (!import.meta.client) {
      return {}
    }

    const rawPayload = window.localStorage.getItem(buildStorageKey(sourceName))
    if (!rawPayload) {
      return {}
    }

    try {
      const parsedPayload = JSON.parse(rawPayload) as SavedColorPayload
      lastSavedAt.value = parsedPayload.savedAt ?? null
      return parsedPayload.faceColors ?? {}
    } catch {
      return {}
    }
  }

  return {
    lastSavedAt: readonly(lastSavedAt),
    saveModelFaceColors,
    loadSavedFaceColors
  }
}
