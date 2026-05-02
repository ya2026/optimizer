declare global {
  interface Window {
    occtimportjs?: (config?: {
      locateFile?: (fileName: string) => string
    }) => Promise<unknown>
  }
}

export {}
