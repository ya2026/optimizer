import { watch, type Ref } from 'vue'
import {
  AmbientLight,
  AxesHelper,
  Box3,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useStepImportState } from '~/composables/useStepImportState'
import { useStepImporter } from '~/composables/useStepImporter'
import { useStepModelProcessor } from '~/composables/useStepModelProcessor'
import type { ProcessedStepModel } from '~/types/step-model'

interface ThreeViewportState {
  scene: Scene | null
  camera: PerspectiveCamera | null
  renderer: WebGLRenderer | null
  controls: OrbitControls | null
  animationFrameId: number | null
  currentModel: ProcessedStepModel | null
  currentHelperGroup: Group | null
  stopWatchingImportState: (() => void) | null
}

/**
 * Manage the Three.js scene lifecycle and connect imported STEP files to the viewport.
 */
export const useThreeViewport = (
  containerRef: Ref<HTMLDivElement | null>
) => {
  const { activeFile, updateFileStatus } = useStepImportState()
  const { importStepFile } = useStepImporter()
  const { fitCameraToModel } = useStepModelProcessor()

  const state: ThreeViewportState = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animationFrameId: null,
    currentModel: null,
    currentHelperGroup: null,
    stopWatchingImportState: null
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

    const gridHelper = new GridHelper(1.2, 12, 0x8aa0a5, 0xc9d4d7)
    helperGroup.add(gridHelper)

    const axesHelper = new AxesHelper(0.6)
    helperGroup.add(axesHelper)

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
    const distance = Math.max(radius * 2.6, 1.6)

    state.controls.target.copy(center)
    state.camera.position.set(
      center.x + distance,
      center.y + distance * 0.7,
      center.z + distance
    )
    state.camera.near = 0.01
    state.camera.far = Math.max(distance * 20, 100)
    state.camera.updateProjectionMatrix()

    state.controls.minDistance = Math.max(radius * 0.2, 0.1)
    state.controls.maxDistance = Math.max(radius * 12, 25)
    state.controls.update()
  }

  const disposeCurrentModel = (): void => {
    if (!state.scene || !state.currentModel) {
      return
    }

    state.scene.remove(state.currentModel.group)

    state.currentModel.meshes.forEach(({ geometry, mesh }) => {
      geometry.dispose()

      const material = mesh.material
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose())
      } else {
        material.dispose()
      }
    })

    state.currentModel = null
  }

  const renderImportedFile = async (): Promise<void> => {
    const fileItem = activeFile.value

    if (!fileItem || !state.scene) {
      return
    }

    updateFileStatus(fileItem.id, 'processing')

    try {
      const processedModel = await importStepFile(fileItem.file)

      disposeCurrentModel()
      state.scene.add(processedModel.group)
      state.currentModel = processedModel

      frameModel(processedModel)
      updateFileStatus(fileItem.id, 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'STEP import failed.'
      updateFileStatus(fileItem.id, 'error', message)
    }
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

    state.stopWatchingImportState = watch(
      () => activeFile.value?.id,
      async () => {
        await renderImportedFile()
      },
      { immediate: true }
    )
  }

  const disposeViewport = (): void => {
    window.removeEventListener('resize', resizeViewport)
    state.stopWatchingImportState?.()
    state.stopWatchingImportState = null

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
  }

  return {
    initializeViewport,
    disposeViewport
  }
}
