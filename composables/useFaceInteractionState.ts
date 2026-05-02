import type { SelectedStepFace } from '~/types/step-model'

interface FaceInteractionState {
  manualColoringEnabled: boolean
  selectedColorId: string | null
  selectedFace: SelectedStepFace | null
  separationRequestToken: number
  autoColorRequestToken: number
}

const state = useState<FaceInteractionState>('face-interaction-state', () => ({
  manualColoringEnabled: true,
  selectedColorId: 'ash-rose',
  selectedFace: null,
  separationRequestToken: 0,
  autoColorRequestToken: 0
}))

export const useFaceInteractionState = () => {
  const setManualColoringEnabled = (enabled: boolean): void => {
    state.value.manualColoringEnabled = enabled
  }

  const setSelectedColorId = (colorId: string): void => {
    state.value.selectedColorId = colorId
  }

  const setSelectedFace = (selectedFace: SelectedStepFace | null): void => {
    state.value.selectedFace = selectedFace
  }

  const requestFaceSeparation = (): void => {
    state.value.separationRequestToken += 1
  }

  const requestAutoColor = (): void => {
    state.value.autoColorRequestToken += 1
  }

  const canSeparateSelectedFace = computed(() => state.value.selectedFace !== null)

  return {
    state: readonly(state),
    canSeparateSelectedFace,
    setManualColoringEnabled,
    setSelectedColorId,
    setSelectedFace,
    requestFaceSeparation,
    requestAutoColor
  }
}
