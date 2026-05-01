import type { OcctStepReadResult } from '~/types/step-model'

interface OcctModule {
  ReadStepFile: (content: Uint8Array, params: Record<string, unknown> | null) => OcctStepReadResult
}

let occtModulePromise: Promise<OcctModule> | null = null

/**
 * Lazily initialize the OpenCascade WASM module in the browser.
 */
export const useOcctLoader = () => {
  const loadOcct = async (): Promise<OcctModule> => {
    if (!import.meta.client) {
      throw new Error('STEP parsing is only available in the browser.')
    }

    if (!occtModulePromise) {
      const occtImportModule = await import('~/public/occt-import-js.js')
      const occtImportFactory = occtImportModule.default as (config: {
        locateFile: (fileName: string) => string
      }) => Promise<OcctModule>

      occtModulePromise = occtImportFactory({
        locateFile: (fileName: string) => {
          if (fileName.endsWith('.wasm')) {
            return '/occt-import-js.wasm'
          }

          return fileName
        }
      })
    }

    return await occtModulePromise
  }

  return {
    loadOcct
  }
}
