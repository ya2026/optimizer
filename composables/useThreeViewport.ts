import type { Ref } from 'vue'
import {
  AmbientLight,
  AxesHelper,
  Color,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface ThreeViewportState {
  scene: Scene | null
  camera: PerspectiveCamera | null
  renderer: WebGLRenderer | null
  controls: OrbitControls | null
  animationFrameId: number | null
}

/**
 * Initialize the reusable Three.js viewport infrastructure.
 * Business logic such as STEP parsing and model processing will be added later.
 */
export const useThreeViewport = (
  containerRef: Ref<HTMLDivElement | null>
) => {
  const state: ThreeViewportState = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animationFrameId: null
  }

  /**
   * Keep camera and renderer dimensions synchronized with the current container.
   */
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

  /**
   * Build the scene-level lights to ensure the future model has a clear base illumination.
   */
  const createLights = (scene: Scene): void => {
    const ambientLight = new AmbientLight(0xffffff, 1.8)
    scene.add(ambientLight)

    const directionalLight = new DirectionalLight(0xffffff, 2.4)
    directionalLight.position.set(4, 8, 6)
    scene.add(directionalLight)
  }

  /**
   * Add lightweight helpers for the early viewport stage.
   * They can be removed or replaced once the real model pipeline is connected.
   */
  const createHelpers = (scene: Scene): void => {
    const gridHelper = new GridHelper(2, 20, 0x8aa0a5, 0xc9d4d7)
    scene.add(gridHelper)

    const axesHelper = new AxesHelper(0.8)
    scene.add(axesHelper)
  }

  /**
   * Start the render loop and let OrbitControls update damping each frame.
   */
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

  /**
   * Create the base viewport with scene, camera, renderer, orbit controls, and lights.
   */
  const initializeViewport = (): void => {
    const container = containerRef.value

    if (!container || state.renderer) {
      return
    }

    const scene = new Scene()
    scene.background = new Color('#edf3f4')

    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
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
    controls.minDistance = 0.5
    controls.maxDistance = 20
    controls.target.set(0, 0.3, 0)

    state.scene = scene
    state.camera = camera
    state.renderer = renderer
    state.controls = controls

    createLights(scene)
    createHelpers(scene)
    resizeViewport()
    controls.update()
    startRenderLoop()

    window.addEventListener('resize', resizeViewport)
  }

  /**
   * Release WebGL and event resources when the component is destroyed.
   */
  const disposeViewport = (): void => {
    window.removeEventListener('resize', resizeViewport)

    if (state.animationFrameId !== null) {
      window.cancelAnimationFrame(state.animationFrameId)
      state.animationFrameId = null
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
