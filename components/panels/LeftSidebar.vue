<script setup lang="ts">
import { ref } from 'vue'
import PanelSection from '~/components/panels/PanelSection.vue'
import { useStepImportState } from '~/composables/useStepImportState'

const directoryInputRef = ref<HTMLInputElement | null>(null)
const filesInputRef = ref<HTMLInputElement | null>(null)

const {
  state,
  activeFile,
  registerFiles,
  setActiveFile
} = useStepImportState()

const openDirectoryPicker = (): void => {
  directoryInputRef.value?.click()
}

const openFilePicker = (): void => {
  filesInputRef.value?.click()
}

const onFileInputChange = (event: Event): void => {
  const target = event.target as HTMLInputElement

  if (!target.files?.length) {
    return
  }

  registerFiles(target.files)
}
</script>

<template>
  <aside class="sidebar-panel">
    <PanelSection
      title="File Operations"
      description="Reserve the local import entry and file list area for batch STEP file management."
    >
      <div class="action-card-list">
        <button
          type="button"
          class="action-card"
          @click="openDirectoryPicker"
        >
          <span class="action-card__title">Select Local Folder</span>
          <span class="action-card__hint">Select a local directory containing STEP files</span>
        </button>

        <button
          type="button"
          class="action-card"
          @click="openFilePicker"
        >
          <span class="action-card__title">Import STEP Files</span>
          <span class="action-card__hint">Import one or more `.step` or `.stp` files</span>
        </button>
      </div>

      <input
        ref="directoryInputRef"
        type="file"
        multiple
        webkitdirectory
        class="visually-hidden"
        accept=".step,.stp"
        @change="onFileInputChange"
      >

      <input
        ref="filesInputRef"
        type="file"
        multiple
        class="visually-hidden"
        accept=".step,.stp"
        @change="onFileInputChange"
      >
    </PanelSection>

    <PanelSection
      title="Model File List"
      description="Imported STEP files are listed here. Selecting a file will render and process it in the central viewport."
    >
      <ul class="file-list">
        <li
          v-for="fileItem in state.files"
          :key="fileItem.id"
          class="file-list__item"
          :class="{ 'file-list__item--active': activeFile?.id === fileItem.id }"
          @click="setActiveFile(fileItem.id)"
        >
          <div class="file-list__content">
            <span class="file-list__name">{{ fileItem.name }}</span>
            <span
              v-if="fileItem.errorMessage"
              class="file-list__meta file-list__meta--error"
            >
              {{ fileItem.errorMessage }}
            </span>
            <span
              v-else
              class="file-list__meta"
            >
              {{ fileItem.status }}
            </span>
          </div>

          <span class="file-list__tag">STEP</span>
        </li>

        <li
          v-if="!state.files.length"
          class="file-list__empty"
        >
          No STEP files selected yet.
        </li>
      </ul>
    </PanelSection>
  </aside>
</template>
