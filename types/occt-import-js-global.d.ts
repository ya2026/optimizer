<<<<<<< HEAD
import type { OcctStepReadResult } from '~/types/step-model'

interface OcctModule {
  ReadStepFile: (content: Uint8Array, params: Record<string, unknown> | null) => OcctStepReadResult
}

declare global {
  interface Window {
    occtimportjs?: (config: {
      locateFile: (fileName: string) => string
    }) => Promise<OcctModule>
=======
declare global {
  interface Window {
    occtimportjs?: (config?: {
      locateFile?: (fileName: string) => string
    }) => Promise<unknown>
>>>>>>> dev
  }
}

export {}
