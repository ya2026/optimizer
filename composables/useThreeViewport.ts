import { watch, type Ref } from 'vue'
import {
  AmbientLight,
  AxesHelper,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  MeshStandardMaterial,
  MOUSE,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  TOUCH,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useFaceColorPersistence } from '~/composables/useFaceColorPersistence'
import { useFaceInteractionState } from '~/composables/useFaceInteractionState'
import { useMorandiPalette } from '~/composables/useMorandiPalette'
import { useProcessedModelState } from '~/composables/useProcessedModelState'
import { useStepImporter } from '~/composables/useStepImporter'
import { useStepImportState } from '~/composables/useStepImportState'
import { useStepModelProcessor } from '~/composables/useStepModelProcessor'
import type {
  MorandiColorOption,
  ProcessedStepMesh,
  ProcessedStepModel,
  SelectedStepFace
} from '~/types/step-model'

const DEFAULT_VIEW_DIRECTION = new Vector3(0.92, 0.5, 0.92).normalize()
const FRONT_VIEW_DIRECTION = new Vector3(0, 0, 1)

interface ThreeViewportState {
  scene: Scene | null
  camera: PerspectiveCamera | null
  renderer: WebGLRenderer | null
  controls: OrbitControls | null
  animationFrameId: number | null
  currentModel: ProcessedStepModel | null
  currentHelperGroup: Group | null
  stopWatchingImportState: (() => void) | null
  stopWatchingFaceState: (() => void) | null
  raycaster: Raycaster
  pointer: Vector2
  importRequestToken: number
}

export const useThreeViewport = (
  containerRef: Ref<HTMLDivElement | null>
) => {
  const { activeFile, updateFileStatus } = useStepImportState()
  const { setCurrentModel } = useProcessedModelState()
  const {
    state: faceInteractionState,
    setSelectedFace
  } = useFaceInteractionState()
  const { saveModelFaceColors, loadSavedFaceColors } = useFaceColorPersistence()
  const { morandiColors } = useMorandiPalette()
  const { importStepFile } = useStepImporter()
  const {
    fitCameraToModel,
    highlightFace,
    clearTemporaryMaterials,
    applyColorToFace,
    autoColorModel,
    applySavedFaceColors,
    separateFace
  } = useStepModelProcessor()

  const state: ThreeViewportState = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animationFrameId: null,
    currentModel: null,
    currentHelperGroup: null,
    stopWatchingImportState: null,
    stopWatchingFaceState: null,
    raycaster: new Raycaster(),
    pointer: new Vector2(),
    importRequestToken: 0
  }

  const resizeViewport = (): void => {
    const container = containerRef.value

    if (!container || !state.camera || !state.renderer) {
      return
    }

    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)

    state.camera.aspect = width / height
    state.camera.updateProjectionMatrix()
    state.renderer.setSize(width, height, false)
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  const createLights = (scene: Scene): void => {
    const ambientLight = new AmbientLight(0xffffff, 1.9)
    scene.add(ambientLight)

    const directionalLight = new DirectionalLight(0xffffff, 2.3)
    directionalLight.position.set(4, 8, 6)
    scene.add(directionalLight)

    const fillLight = new DirectionalLight(0xffffff, 1.2)
    fillLight.position.set(-5, 4, -3)
    scene.add(fillLight)
  }

  const createHelperGroup = (): Group => {
    const helperGroup = new Group()
    helperGroup.name = 'ViewportHelpers'
    helperGroup.add(new GridHelper(1.2, 12, 0x8aa0a5, 0xc9d4d7))
    helperGroup.add(new AxesHelper(0.6))
    return helperGroup
  }

  const startRenderLoop = (): void => {
    if (!state.scene || !state.camera || !state.renderer || !state.controls) {
      return
    }

    const renderFrame = (): void => {
      state.animationFrameId = window.requestAnimationFrame(renderFrame)
      state.controls?.update()
      state.renderer?.render(state.scene as Scene, state.camera as PerspectiveCamera)
    }

    renderFrame()
  }

  const frameModel = (model: ProcessedStepModel): void => {
    if (!state.camera || !state.controls) {
      return
    }

    const { center, radius } = fitCameraToModel(model)
    const distance = Math.max(radius * 1.95, 1.15)

    state.controls.target.copy(center)
    state.camera.position.copy(
      center.clone().add(DEFAULT_VIEW_DIRECTION.clone().multiplyScalar(distance))
    )
    state.camera.near = 0.01
    state.camera.far = Math.max(distance * 20, 100)
    state.camera.updateProjectionMatrix()
    state.controls.minDistance = Math.max(radius * 0.18, 0.08)
    state.controls.maxDistance = Math.max(radius * 10, 18)
    state.controls.update()
  }

  const setFrontView = (): void => {
    if (!state.currentModel || !state.camera || !state.controls) {
      return
    }

    const { center, radius } = fitCameraToModel(state.currentModel)
    const distance = Math.max(radius * 1.95, 1.15)

    state.controls.target.copy(center)
    state.camera.position.copy(
      center.clone().add(FRONT_VIEW_DIRECTION.clone().multiplyScalar(distance))
    )
    state.camera.up.set(0, 1, 0)
    state.camera.lookAt(center)
    state.camera.updateProjectionMatrix()
    state.controls.update()
  }

  const disposeCurrentModel = (): void => {
    if (!state.scene || !state.currentModel) {
      return
    }

    state.scene.remove(state.currentModel.group)

    state.currentModel.meshes.forEach((processedMesh) => {
      const { geometry, materials, mesh } = processedMesh

      clearTemporaryMaterials(processedMesh)
      geometry.dispose()
      materials.forEach((material) => material.dispose())

      const currentMaterial = mesh.material
      if (Array.isArray(currentMaterial)) {
        currentMaterial.forEach((material) => {
          const typedMaterial = material as MeshStandardMaterial

          if (!materials.includes(typedMaterial)) {
            typedMaterial.dispose()
          }
        })
      }
    })

    state.currentModel = null
    setCurrentModel(null)
    setSelectedFace(null)
  }

  const renderImportedFile = async (): Promise<void> => {
    const fileItem = activeFile.value

    if (!fileItem || !state.scene) {
      return
    }

    state.importRequestToken += 1
    const currentRequestToken = state.importRequestToken

    updateFileStatus(fileItem.id, 'processing')

    try {
      const processedModel = await importStepFile(fileItem.file)

      if (currentRequestToken !== state.importRequestToken) {
        processedModel.meshes.forEach((processedMesh) => {
          processedMesh.geometry.dispose()
          processedMesh.materials.forEach((material) => material.dispose())
        })
        return
      }

      disposeCurrentModel()
      state.scene.add(processedModel.group)
      state.currentModel = processedModel
      setCurrentModel(processedModel)

      autoColorModel(processedModel)
      applySavedFaceColors(processedModel, loadSavedFaceColors(processedModel.sourceName))
      frameModel(processedModel)
      updateFileStatus(fileItem.id, 'success')
      setSelectedFace(null)
    } catch (error) {
      if (currentRequestToken !== state.importRequestToken) {
        return
      }

      disposeCurrentModel()
      const message = error instanceof Error ? error.message : 'STEP 文件导入失败。'
      updateFileStatus(fileItem.id, 'error', message)
    }
  }

  const findProcessedMeshByObject = (meshId: string): ProcessedStepMesh | null => {
    return state.currentModel?.meshes.find((meshItem) => meshItem.id === meshId) ?? null
  }

  const findFaceMappingByTriangleOffset = (
    processedMesh: ProcessedStepMesh,
    triangleOffset: number
  ) => {
    return processedMesh.faceMappings.find((mapping) => (
      mapping.triangleIndices.includes(triangleOffset)
    )) ?? null
  }

  const clearHighlightAcrossModel = (): void => {
    state.currentModel?.meshes.forEach((processedMesh) => {
      clearTemporaryMaterials(processedMesh)
    })
  }

  const updateHighlightForSelection = (): void => {
    clearHighlightAcrossModel()

    const selectedFace = faceInteractionState.value.selectedFace
    if (!selectedFace || !state.currentModel) {
      return
    }

    const processedMesh = state.currentModel.meshes.find((meshItem) => meshItem.id === selectedFace.meshId)
    if (!processedMesh) {
      return
    }

    highlightFace(processedMesh, selectedFace.faceId)
  }

  const getSelectedColor = (): MorandiColorOption | null => {
    return morandiColors.find((color) => color.id === faceInteractionState.value.selectedColorId) ?? null
  }

  const applySelectedColorToSelection = (): void => {
    const selectedFace = faceInteractionState.value.selectedFace
    const selectedColor = getSelectedColor()

    if (!selectedFace || !selectedColor || !state.currentModel) {
      return
    }

    const processedMesh = state.currentModel.meshes.find((meshItem) => meshItem.id === selectedFace.meshId)
    if (!processedMesh) {
      return
    }

    applyColorToFace(processedMesh, selectedFace.faceId, selectedColor)
    highlightFace(processedMesh, selectedFace.faceId, {
      preserveMaterialColor: true
    })
  }

  const syncSelectionPresentation = (): void => {
    if (!state.currentModel) {
      return
    }

    if (!faceInteractionState.value.selectedFace) {
      clearHighlightAcrossModel()
      return
    }

    if (faceInteractionState.value.manualColoringEnabled) {
      applySelectedColorToSelection()
      return
    }

    updateHighlightForSelection()
  }

  const separateSelectedFace = (): void => {
    const selectedFace = faceInteractionState.value.selectedFace

    if (!selectedFace || !state.currentModel) {
      return
    }

    const separatedMesh = separateFace(state.currentModel, selectedFace)
    if (!separatedMesh) {
      return
    }

    setSelectedFace({
      meshId: separatedMesh.id,
      faceId: separatedMesh.faceMappings[0].id,
      meshName: separatedMesh.name,
      isSeparatedFace: true
    })

    syncSelectionPresentation()
  }

  const handleCanvasClick = (event: MouseEvent): void => {
    const container = containerRef.value

    if (!container || !state.camera || !state.currentModel) {
      return
    }

    const rect = container.getBoundingClientRect()
    state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    state.raycaster.setFromCamera(state.pointer, state.camera)

    const targetMeshes = state.currentModel.meshes.map((meshItem) => meshItem.mesh)
    const intersections = state.raycaster.intersectObjects(targetMeshes, false)
    const firstIntersection = intersections[0]

    if (!firstIntersection || firstIntersection.faceIndex == null) {
      setSelectedFace(null)
      clearHighlightAcrossModel()
      return
    }

    const meshId = firstIntersection.object.userData.meshId as string | undefined
    if (!meshId) {
      return
    }

    const processedMesh = findProcessedMeshByObject(meshId)
    if (!processedMesh) {
      return
    }

    const faceMapping = findFaceMappingByTriangleOffset(processedMesh, firstIntersection.faceIndex)
    if (!faceMapping) {
      return
    }

    const nextSelection: SelectedStepFace = {
      meshId: processedMesh.id,
      faceId: faceMapping.id,
      meshName: processedMesh.name,
      isSeparatedFace: processedMesh.isSeparatedFace
    }

    setSelectedFace(nextSelection)
    syncSelectionPresentation()
  }

  const initializeViewport = (): void => {
    const container = containerRef.value

    if (!container || state.renderer) {
      return
    }

    const scene = new Scene()
    scene.background = new Color('#edf3f4')

    const camera = new PerspectiveCamera(45, 1, 0.01, 100)
    camera.position.set(2.4, 2.1, 2.8)

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true
    })
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setClearAlpha(0)

    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.enableZoom = true
    controls.enableRotate = true
    controls.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN
    }
    controls.touches = {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_PAN
    }
    controls.target.set(0, 0, 0)
    controls.update()

    state.scene = scene
    state.camera = camera
    state.renderer = renderer
    state.controls = controls

    createLights(scene)

    const helperGroup = createHelperGroup()
    scene.add(helperGroup)
    state.currentHelperGroup = helperGroup

    resizeViewport()
    startRenderLoop()

    window.addEventListener('resize', resizeViewport)
    renderer.domElement.addEventListener('click', handleCanvasClick)

    state.stopWatchingImportState = watch(
      () => activeFile.value?.id,
      async () => {
        await renderImportedFile()
      },
      { immediate: true }
    )

    state.stopWatchingFaceState = watch(
      [
        () => faceInteractionState.value.selectedColorId,
        () => faceInteractionState.value.autoColorRequestToken,
        () => faceInteractionState.value.separationRequestToken,
        () => faceInteractionState.value.saveColorRequestToken,
        () => faceInteractionState.value.selectedFace?.faceId,
        () => faceInteractionState.value.manualColoringEnabled
      ],
      (
        [selectedColorId, autoColorToken, separationToken, saveColorToken, selectedFaceId, manualColoringEnabled],
        previousValues
      ) => {
        if (!state.currentModel) {
          return
        }

        const previousSelectedColorId = previousValues?.[0] ?? null
        const previousAutoColorToken = previousValues?.[1] ?? null
        const previousSeparationToken = previousValues?.[2] ?? null
        const previousSaveColorToken = previousValues?.[3] ?? null
        const previousSelectedFaceId = previousValues?.[4] ?? null
        const previousManualColoringEnabled = previousValues?.[5] ?? null

        if (autoColorToken !== previousAutoColorToken) {
          autoColorModel(state.currentModel)
          syncSelectionPresentation()
        }

        if (separationToken !== previousSeparationToken) {
          separateSelectedFace()
          return
        }

        if (saveColorToken !== previousSaveColorToken) {
          saveModelFaceColors(state.currentModel)
          syncSelectionPresentation()
          return
        }

        const selectionChanged = selectedFaceId !== previousSelectedFaceId
        const modeChanged = manualColoringEnabled !== previousManualColoringEnabled
        const colorChanged = selectedColorId !== previousSelectedColorId

        if (selectionChanged || modeChanged || (colorChanged && manualColoringEnabled)) {
          syncSelectionPresentation()
        }
      }
    )
  }

  const disposeViewport = (): void => {
    window.removeEventListener('resize', resizeViewport)
    state.stopWatchingImportState?.()
    state.stopWatchingFaceState?.()
    state.stopWatchingImportState = null
    state.stopWatchingFaceState = null

    if (state.renderer) {
      state.renderer.domElement.removeEventListener('click', handleCanvasClick)
    }

    if (state.animationFrameId !== null) {
      window.cancelAnimationFrame(state.animationFrameId)
      state.animationFrameId = null
    }

    disposeCurrentModel()

    if (state.currentHelperGroup && state.scene) {
      state.scene.remove(state.currentHelperGroup)
      state.currentHelperGroup = null
    }

    state.controls?.dispose()
    state.renderer?.dispose()

    const rendererCanvas = state.renderer?.domElement
    if (rendererCanvas?.parentNode) {
      rendererCanvas.parentNode.removeChild(rendererCanvas)
    }

    state.scene = null
    state.camera = null
    state.renderer = null
    state.controls = null
    setCurrentModel(null)
  }

  return {
    initializeViewport,
    disposeViewport,
    setFrontView
  }
}
