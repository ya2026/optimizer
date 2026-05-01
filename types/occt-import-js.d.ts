declare module '~/public/occt-import-js.js' {
  const occtImportFactory: (config?: {
    locateFile?: (fileName: string) => string
  }) => Promise<unknown>

  export default occtImportFactory
}
