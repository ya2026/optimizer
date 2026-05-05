import { computed, ref, type Ref } from 'vue'
import type { Object3D } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { useFbxExport } from '~/composables/useFbxExport'
import { useProcessedModelState } from '~/composables/useProcessedModelState'
import { useStepImporter } from '~/composables/useStepImporter'
import { useStepImportState } from '~/composables/useStepImportState'
import { useStepModelProcessor } from '~/composables/useStepModelProcessor'
import type { ProcessedStepMesh, ProcessedStepModel } from '~/types/step-model'

type ExportFormat = 'glb' | 'fbx'

/**
 * Export the full processed scene model in browser-friendly 3D file formats.
 */
export const useModelExport = () => {
  const { currentModel } = useProcessedModelState()
  const { state: importState } = useStepImportState()
  const { importStepFile } = useStepImporter()
  const { clearTemporaryMaterials } = useStepModelProcessor()
  const { exportObjectAsFbx } = useFbxExport()
  const isBatchExporting = ref(false)

  const exportCurrentModelAsGlb = async (): Promise<void> => {
    const model = prepareModelForExport(currentModel.value as ProcessedStepModel | null)

    if (!model) {
      return
    }

    await exportProcessedModelAsGlb(model, `${sanitizeFileName(model.sourceName)}.glb`)
  }

  const exportCurrentModelAsFbx = async (): Promise<void> => {
    const model = prepareModelForExport(currentModel.value as ProcessedStepModel | null)

    if (!model) {
      return
    }

    await exportProcessedModelAsFbx(model, `${sanitizeFileName(model.sourceName)}.fbx`)
  }

  const exportBatchModelsAsGlb = async (): Promise<void> => {
    await exportBatchModels('glb')
  }

  const exportBatchModelsAsFbx = async (): Promise<void> => {
    await exportBatchModels('fbx')
  }

  const exportBatchModels = async (format: ExportFormat): Promise<void> => {
    const files = importState.value.files

    if (!files.length || isBatchExporting.value) {
      return
    }

    isBatchExporting.value = true

    try {
      for (const fileItem of files) {
        const processedModel = await importStepFile(fileItem.file)
        const exportName = `${sanitizeFileName(fileItem.name)}.${format}`

        if (format === 'glb') {
          await exportProcessedModelAsGlb(processedModel, exportName)
        } else {
          await exportProcessedModelAsFbx(processedModel, exportName)
        }

        // Small delay helps browser download handling during multiple downloads.
        await waitForNextDownload()
      }
    } finally {
      isBatchExporting.value = false
    }
  }

  const exportProcessedModelAsGlb = async (
    model: ProcessedStepModel,
    fileName: string
  ): Promise<void> => {
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

    const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' })
    triggerBrowserDownload(blob, fileName)
  }

  const exportProcessedModelAsFbx = async (
    model: ProcessedStepModel,
    fileName: string
  ): Promise<void> => {
    const fbxBlob = exportObjectAsFbx(model.group, model.sourceName)
    triggerBrowserDownload(fbxBlob, fileName)
  }

  const prepareModelForExport = (model: ProcessedStepModel | null): ProcessedStepModel | null => {
    if (!model) {
      return null
    }

    model.meshes.forEach((processedMesh) => {
      clearTemporaryMaterials(processedMesh as ProcessedStepMesh)
    })
    model.group.updateMatrixWorld(true)

    return model
  }

  return {
    exportCurrentModelAsGlb,
    exportCurrentModelAsFbx,
    exportBatchModelsAsGlb,
    exportBatchModelsAsFbx,
    hasExportableModel: computed(() => currentModel.value !== null),
    hasBatchExportableModels: computed(() => importState.value.files.length > 0),
    isBatchExporting
  }
}

const waitForNextDownload = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 80)
  })
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
