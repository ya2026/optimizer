import { watch, toRaw } from 'vue'
import { Quaternion, Vector3 } from 'three'
import { useFaceInteractionState } from '~/composables/useFaceInteractionState'
import { useMorandiPalette } from '~/composables/useMorandiPalette'
import { useProcessedModelState } from '~/composables/useProcessedModelState'
import { useStepModelProcessor } from '~/composables/useStepModelProcessor'
import type { MorandiColorOption, ProcessedStepModel } from '~/types/step-model'

type RotationAxis = 'x' | 'y' | 'z'
type RotationDirection = 90 | -90

const AXIS_VECTOR_MAP: Record<RotationAxis, Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1)
}

/**
 * Apply object-level transforms to the processed model group for immediate viewport feedback.
 */
export const useModelTransform = () => {
  const { currentModel, mutableCurrentModel } = useProcessedModelState()
  const { state: faceInteractionState } = useFaceInteractionState()
  const { morandiColors } = useMorandiPalette()
  const {
    clearTemporaryMaterials,
    applyColorToFace,
    highlightFace
  } = useStepModelProcessor()
  const rotationState = useState('model-rotation-state', () => ({
    x: 0,
    y: 0,
    z: 0
  }))

  const rotateCurrentModel = (
    axis: RotationAxis,
    direction: RotationDirection
  ): void => {
    const model = toRaw(mutableCurrentModel.value) as ProcessedStepModel | null

    if (!model) {
      return
    }

    const axisVector = AXIS_VECTOR_MAP[axis].clone()
    const rotationRadians = direction > 0 ? Math.PI / 2 : -Math.PI / 2
    const nextQuaternion = new Quaternion().setFromAxisAngle(axisVector, rotationRadians)

    model.meshes.forEach((processedMesh) => {
      clearTemporaryMaterials(processedMesh)
    })

    model.group.quaternion.premultiply(nextQuaternion)
    model.group.updateMatrixWorld(true)
    rotationState.value[axis] = normalizeAngle(rotationState.value[axis] + direction)

    restoreSelectionPresentation()
  }

  const restoreSelectionPresentation = (): void => {
    const model = toRaw(mutableCurrentModel.value) as ProcessedStepModel | null
    const selectedFace = faceInteractionState.value.selectedFace

    if (!model || !selectedFace) {
      return
    }

    const processedMesh = model.meshes.find((meshItem) => meshItem.id === selectedFace.meshId)
    if (!processedMesh) {
      return
    }

    if (faceInteractionState.value.manualColoringEnabled) {
      const selectedColor = morandiColors.find((color) => color.id === faceInteractionState.value.selectedColorId) ?? null

      if (selectedColor) {
        applyColorToFace(processedMesh, selectedFace.faceId, selectedColor as MorandiColorOption)
      }

      highlightFace(processedMesh, selectedFace.faceId, {
        preserveMaterialColor: true
      })
      return
    }

    highlightFace(processedMesh, selectedFace.faceId)
  }

  const resetRotationState = (): void => {
    rotationState.value = {
      x: 0,
      y: 0,
      z: 0
    }
  }

  watch(
    () => currentModel.value,
    () => {
      resetRotationState()
    }
  )

  return {
    rotateCurrentModel,
    rotationState: readonly(rotationState),
    hasTransformableModel: computed(() => currentModel.value !== null)
  }
}

const normalizeAngle = (angle: number): number => {
  const normalized = angle % 360

  if (Object.is(normalized, -0)) {
    return 0
  }

  return normalized
}
