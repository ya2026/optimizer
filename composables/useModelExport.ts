import type { Object3D } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { useFbxExport } from '~/composables/useFbxExport'
import { useProcessedModelState } from '~/composables/useProcessedModelState'
import { useStepModelProcessor } from '~/composables/useStepModelProcessor'
import type { ProcessedStepMesh, ProcessedStepModel } from '~/types/step-model'

/**
 * Export the full processed scene model in browser-friendly 3D file formats.
 */
export const useModelExport = () => {
  const { currentModel } = useProcessedModelState()
  const { clearTemporaryMaterials } = useStepModelProcessor()
  const { exportObjectAsFbx } = useFbxExport()

  const exportCurrentModelAsGlb = async (): Promise<void> => {
    const model = prepareModelForExport()

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
    triggerBrowserDownload(blob, fileName)
  }

  const exportCurrentModelAsFbx = async (): Promise<void> => {
    const model = prepareModelForExport()

    if (!model) {
      return
    }

    const fileName = `${sanitizeFileName(model.sourceName)}.fbx`
    const fbxBlob = exportObjectAsFbx(model.group, model.sourceName)

    triggerBrowserDownload(fbxBlob, fileName)
  }

  const prepareModelForExport = () => {
    const model = currentModel.value as ProcessedStepModel | null

    if (!model) {
      return null
    }

    // Highlight materials are temporary view-state overlays and should not leak into exported files.
    model.meshes.forEach((processedMesh) => {
      clearTemporaryMaterials(processedMesh as ProcessedStepMesh)
    })
    model.group.updateMatrixWorld(true)

    return model
  }

  return {
    exportCurrentModelAsGlb,
    exportCurrentModelAsFbx,
    hasExportableModel: computed(() => currentModel.value !== null)
  }
}

const triggerBrowserDownload = (blob: Blob, fileName: string): void => {
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

const sanitizeFileName = (fileName: string): string => {
  const normalizedName = fileName.replace(/\.(step|stp)$/i, '')
  const sanitizedName = normalizedName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').trim()
  return sanitizedName || 'step-model'
}
