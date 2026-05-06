import type { OcctStepReadResult } from '~/types/step-model'

interface OcctModule {
  ReadStepFile: (content: Uint8Array, params: Record<string, unknown> | null) => OcctStepReadResult
}

let occtModulePromise: Promise<OcctModule> | null = null
let occtScriptPromise: Promise<void> | null = null

const OCCT_SCRIPT_ID = 'occt-import-js-runtime'

const loadOcctScript = async (): Promise<void> => {
  if (!import.meta.client) {
    throw new Error('STEP 解析仅支持在浏览器环境中运行。')
  }

  if (window.occtimportjs) {
    return
  }

  if (!occtScriptPromise) {
    occtScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.getElementById(OCCT_SCRIPT_ID) as HTMLScriptElement | null

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true })
        existingScript.addEventListener(
          'error',
          () => reject(new Error('occt-import-js 运行时脚本加载失败。')),
          { once: true }
        )
        return
      }

      const scriptElement = document.createElement('script')
      scriptElement.id = OCCT_SCRIPT_ID
      scriptElement.src = '/occt-import-js.js'
      scriptElement.async = true
      scriptElement.onload = () => resolve()
      scriptElement.onerror = () => reject(new Error('occt-import-js 运行时脚本加载失败。'))

      document.head.appendChild(scriptElement)
    })
  }

  await occtScriptPromise
}

export const useOcctLoader = () => {
  const loadOcct = async (): Promise<OcctModule> => {
    if (!import.meta.client) {
      throw new Error('STEP 解析仅支持在浏览器环境中运行。')
    }

    if (!occtModulePromise) {
      await loadOcctScript()

      const occtImportFactory = window.occtimportjs as ((config: {
        locateFile: (fileName: string) => string
      }) => Promise<OcctModule>) | undefined

      if (!occtImportFactory) {
        throw new Error('occt-import-js 运行时已加载，但工厂函数不可用。')
      }

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
