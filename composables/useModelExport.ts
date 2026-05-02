import type { Object3D } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { useProcessedModelState } from '~/composables/useProcessedModelState'

/**
 * Export the full processed scene model as a binary GLB file in the browser.
 */
export const useModelExport = () => {
  const { currentModel } = useProcessedModelState()

  const exportCurrentModelAsGlb = async (): Promise<void> => {
    const model = currentModel.value

    if (!model) {
      return
    }

    const exporter = new GLTFExporter()

    const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        model.group as unknown as Object3D,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result)
            return
          }

          reject(new Error('GLB 导出结果不是二进制缓冲区。'))
        },
        (error) => {
          reject(error instanceof Error ? error : new Error('GLB 导出失败。'))
        },
        {
          binary: true,
          onlyVisible: true,
          trs: false
        }
      )
    })

    const fileName = `${sanitizeFileName(model.sourceName)}.glb`
    const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' })
    const objectUrl = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')

    downloadLink.href = objectUrl
    downloadLink.download = fileName
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 0)
  }

  return {
    exportCurrentModelAsGlb,
    hasExportableModel: computed(() => currentModel.value !== null)
  }
}

const sanitizeFileName = (fileName: string): string => {
  const normalizedName = fileName.replace(/\.(step|stp)$/i, '')
  const sanitizedName = normalizedName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').trim()
  return sanitizedName || 'step-model'
}
