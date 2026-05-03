<script setup lang="ts">
import { computed, ref } from 'vue'
import ExportPanel from '~/components/panels/ExportPanel.vue'
import PanelSection from '~/components/panels/PanelSection.vue'
import { useStepImportState } from '~/composables/useStepImportState'

const directoryInputRef = ref<HTMLInputElement | null>(null)
const filesInputRef = ref<HTMLInputElement | null>(null)

const {
  state,
  activeFile,
  registerFiles,
  removeFile,
  setActiveFile
} = useStepImportState()

const shouldEnableFileListScroll = computed(() => state.value.files.length >= 2)

const statusLabelMap = {
  idle: '待处理',
  processing: '处理中',
  success: '已完成',
  error: '失败'
} as const

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

const onRemoveFile = (fileId: string): void => {
  removeFile(fileId)
}
</script>

<template>
  <aside class="sidebar-panel sidebar-panel--left">
    <PanelSection title="文件操作">
      <div class="action-card-list">
        <button
          type="button"
          class="action-card"
          @click="openDirectoryPicker"
        >
          <span class="action-card__title">选择本地文件夹</span>
          <span class="action-card__hint">选择包含 STEP 文件的本地目录</span>
        </button>

        <button
          type="button"
          class="action-card"
          @click="openFilePicker"
        >
          <span class="action-card__title">导入 STEP 文件</span>
          <span class="action-card__hint">导入一个或多个 STEP 文件</span>
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
      class="sidebar-panel__stretch"
      title="模型文件列表"
    >
      <div class="file-list-container">
        <div
          class="file-list-scroll"
          :class="{ 'file-list-scroll--scrollable': shouldEnableFileListScroll }"
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
                    {{ statusLabelMap[fileItem.status] }}
                  </span>
                </div>

                <div class="file-list__actions">
                  <span class="file-list__tag">STEP</span>
                  <button
                    type="button"
                    class="file-list__delete"
                    aria-label="删除文件"
                    @click.stop="onRemoveFile(fileItem.id)"
                  >
                    删除
                  </button>
                </div>
            </li>

            <li
              v-if="!state.files.length"
              class="file-list__empty"
            >
              暂未选择 STEP 文件。
            </li>
          </ul>
        </div>
      </div>
    </PanelSection>

    <ExportPanel />
  </aside>
</template>
