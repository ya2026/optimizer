import { useOcctLoader } from '~/composables/useOcctLoader'
import { useStepModelProcessor } from '~/composables/useStepModelProcessor'
import type { OcctStepReadResult, ProcessedStepModel } from '~/types/step-model'

interface ImportAttemptConfig {
  label: string
  params: Record<string, unknown> | null
}

interface ImportAttemptResult {
  label: string
  success: boolean
  meshCount: number
  errorText: string | null
}

const IMPORT_ATTEMPTS: ImportAttemptConfig[] = [
  {
    label: 'meter-bbox-0.001',
    params: {
      linearUnit: 'meter',
      linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: 0.001,
      angularDeflection: 0.5
    }
  },
  {
    label: 'meter-bbox-0.01',
    params: {
      linearUnit: 'meter',
      linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: 0.01,
      angularDeflection: 1
    }
  },
  {
    label: 'millimeter-bbox-0.001',
    params: {
      linearUnit: 'millimeter',
      linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: 0.001,
      angularDeflection: 0.5
    }
  },
  {
    label: 'default-null',
    params: null
  }
]

export const useStepImporter = () => {
  const { loadOcct } = useOcctLoader()
  const { processStepResult } = useStepModelProcessor()

  const importStepFile = async (file: File): Promise<ProcessedStepModel> => {
    const fileBuffer = new Uint8Array(await file.arrayBuffer())
    const occt = await loadOcct()
    const attemptDiagnostics: ImportAttemptResult[] = []
    let lastFailureResult: (OcctStepReadResult & {
      error?: string
      message?: string
      exception?: string
    }) | null = null

    for (const attempt of IMPORT_ATTEMPTS) {
      const result = occt.ReadStepFile(fileBuffer, attempt.params) as OcctStepReadResult & {
        error?: string
        message?: string
        exception?: string
      }

      const meshCount = Array.isArray(result.meshes) ? result.meshes.length : 0
      const errorText = extractOcctErrorText(result)

      attemptDiagnostics.push({
        label: attempt.label,
        success: result.success,
        meshCount,
        errorText
      })

      if (meshCount > 0) {
        return processStepResult(result, file.name)
      }

      lastFailureResult = result
    }

    throw new Error(buildStepImportErrorMessage(file.name, lastFailureResult, attemptDiagnostics))
  }

  return {
    importStepFile
  }
}

const extractOcctErrorText = (result: {
  error?: string
  message?: string
  exception?: string
}): string | null => {
  return [result.error, result.message, result.exception]
    .find((item) => typeof item === 'string' && item.trim().length > 0) ?? null
}

const buildStepImportErrorMessage = (
  fileName: string,
  result: {
    error?: string
    message?: string
    exception?: string
  } | null,
  attemptDiagnostics: ImportAttemptResult[]
): string => {
  const details = result ? extractOcctErrorText(result) : null
  const attemptSummary = attemptDiagnostics
    .map((attempt) => {
      const suffix = attempt.errorText ? `，error=${attempt.errorText}` : ''
      return `${attempt.label}: success=${attempt.success}, meshes=${attempt.meshCount}${suffix}`
    })
    .join(' | ')

  if (details) {
    return `STEP 文件解析失败：${fileName}。${details}。尝试记录：${attemptSummary}`
  }

  return `STEP 文件解析失败：${fileName}。所有参数组合均未生成可渲染 mesh。尝试记录：${attemptSummary}`
}
