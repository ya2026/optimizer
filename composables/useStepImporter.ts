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
    const result = occt.ReadStepFile(fileBuffer, { ...IMPORT_PARAMS }) as OcctStepReadResult

    if (!result.success) {
      throw new Error(`Failed to parse STEP file: ${file.name}`)
    }

    return processStepResult(result, file.name)
  }

  return {
    importStepFile
  }
}
