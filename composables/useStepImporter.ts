import type { OcctStepReadResult, ProcessedStepModel } from '~/types/step-model'
import { useOcctLoader } from '~/composables/useOcctLoader'
import { useStepModelProcessor } from '~/composables/useStepModelProcessor'

const IMPORT_PARAMS = {
  linearUnit: 'meter',
  linearDeflectionType: 'bounding_box_ratio',
  linearDeflection: 0.001,
  angularDeflection: 0.5
} as const

/**
 * Read a STEP file and convert it into a processed Three.js-ready model.
 */
export const useStepImporter = () => {
  const { loadOcct } = useOcctLoader()
  const { processStepResult } = useStepModelProcessor()

  const importStepFile = async (file: File): Promise<ProcessedStepModel> => {
    const fileBuffer = new Uint8Array(await file.arrayBuffer())
    const occt = await loadOcct()
    const result = occt.ReadStepFile(fileBuffer, { ...IMPORT_PARAMS }) as OcctStepReadResult & {
      error?: string
      message?: string
      exception?: string
    }

    if (!result.success) {
      throw new Error(buildStepImportErrorMessage(file.name, result))
    }

    return processStepResult(result, file.name)
  }

  return {
    importStepFile
  }
}

const buildStepImportErrorMessage = (
  fileName: string,
  result: {
    error?: string
    message?: string
    exception?: string
  }
): string => {
  const details = [result.error, result.message, result.exception]
    .find((item) => typeof item === 'string' && item.trim().length > 0)

  if (details) {
    return `STEP 文件解析失败：${fileName}。${details}`
  }

  return `STEP 文件解析失败：${fileName}。当前失败发生在 STEP 解码阶段，通常是文件数据不完整、文件本体损坏，或该文件包含当前解析器暂不支持的 STEP 实体。`
}
