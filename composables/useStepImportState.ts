import { readonly } from 'vue'

export interface StepImportFileItem {
  id: string
  file: File
  name: string
  size: number
  status: 'idle' | 'processing' | 'success' | 'error'
  errorMessage: string | null
}

interface StepImportState {
  files: StepImportFileItem[]
  activeFileId: string | null
}

const createFileId = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified}`
}

const isStepFile = (file: File): boolean => {
  const lowerCaseName = file.name.toLowerCase()
  return lowerCaseName.endsWith('.step') || lowerCaseName.endsWith('.stp')
}

export const useStepImportState = () => {
  const state = useState<StepImportState>('step-import-state', () => ({
    files: [],
    activeFileId: null
  }))

  const registerFiles = (inputFiles: FileList | File[]): void => {
    const fileArray = Array.from(inputFiles).filter(isStepFile)

    const nextItems: StepImportFileItem[] = fileArray.map((file) => ({
      id: createFileId(file),
      file,
      name: file.name,
      size: file.size,
      status: 'idle',
      errorMessage: null
    }))

    state.value.files = nextItems
    state.value.activeFileId = nextItems[0]?.id ?? null
  }

  const setActiveFile = (fileId: string): void => {
    state.value.activeFileId = fileId
  }

  const updateFileStatus = (
    fileId: string,
    status: StepImportFileItem['status'],
    errorMessage: string | null = null
  ): void => {
    const targetFile = state.value.files.find((fileItem) => fileItem.id === fileId)

    if (!targetFile) {
      return
    }

    targetFile.status = status
    targetFile.errorMessage = errorMessage
  }

  const activeFile = computed(() => {
    return state.value.files.find((fileItem) => fileItem.id === state.value.activeFileId) ?? null
  })

  return {
    state: readonly(state),
    activeFile,
    registerFiles,
    setActiveFile,
    updateFileStatus
  }
}
