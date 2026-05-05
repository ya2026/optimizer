import type { ProcessedStepModel } from '~/types/step-model'

export const useProcessedModelState = () => {
  const currentModelState = useState<ProcessedStepModel | null>('processed-model-state', () => null)

  const setCurrentModel = (model: ProcessedStepModel | null): void => {
    currentModelState.value = model
  }

  return {
    mutableCurrentModel: currentModelState,
    currentModel: readonly(currentModelState),
    setCurrentModel
  }
}
