import type { ProcessedStepModel } from '~/types/step-model'

const currentModelState = useState<ProcessedStepModel | null>('processed-model-state', () => null)

export const useProcessedModelState = () => {
  const setCurrentModel = (model: ProcessedStepModel | null): void => {
    currentModelState.value = model
  }

  return {
    currentModel: readonly(currentModelState),
    setCurrentModel
  }
}
