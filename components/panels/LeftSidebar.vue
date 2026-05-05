<script setup lang="ts">
import { computed, ref } from 'vue'
import ExportPanel from '~/components/panels/ExportPanel.vue'
import PanelSection from '~/components/panels/PanelSection.vue'
import {
  useStepImportState,
  type StepImportFileItem
} from '~/composables/useStepImportState'

const directoryInputRef = ref<HTMLInputElement | null>(null)
const filesInputRef = ref<HTMLInputElement | null>(null)

const {
  state,
  activeFile,
  registerFiles,
  removeFile,
  setActiveFile
} = useStepImportState()

<<<<<<< HEAD
=======
const shouldEnableFileListScroll = computed(() => state.value.files.length >= 2)

>>>>>>> dev
const statusLabelMap = {
  idle: '待处理',
  processing: '处理中',
  success: '已完成',
<<<<<<< HEAD
  error: '失败'
} as const

const getStatusLabel = (status: StepImportFileItem['status']): string => {
  return statusLabelMap[status]
}

=======
  error: '导入失败'
} as const

>>>>>>> dev
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
  target.value = ''
}

const onRemoveFile = (fileId: string): void => {
  removeFile(fileId)
}
</script>

<template>
<<<<<<< HEAD
  <aside class="sidebar-panel">
    <PanelSection
      title="文件操作"
      description="提供本地文件夹选择、STEP 文件导入以及批量模型管理入口。"
    >
=======
  <aside class="sidebar-panel sidebar-panel--left">
    <PanelSection title="文件操作">
>>>>>>> dev
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
<<<<<<< HEAD
          <span class="action-card__hint">导入一个或多个 `.step` 或 `.stp` 文件</span>
=======
          <span class="action-card__hint">可追加导入多个 STEP 文件</span>
>>>>>>> dev
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
<<<<<<< HEAD
      title="模型文件列表"
      description="这里会展示已导入的 STEP 文件，点击后会在中间视口中完成处理并显示。"
=======
      class="sidebar-panel__stretch"
      title="模型文件列表"
>>>>>>> dev
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
                  class="file-list__meta"
                  :class="{ 'file-list__meta--error': fileItem.status === 'error' }"
                  :title="fileItem.errorMessage ?? statusLabelMap[fileItem.status]"
                >
                  {{ fileItem.errorMessage ? statusLabelMap.error : statusLabelMap[fileItem.status] }}
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
<<<<<<< HEAD
              {{ getStatusLabel(fileItem.status) }}
            </span>
          </div>

          <span class="file-list__tag">STEP</span>
        </li>

        <li
          v-if="!state.files.length"
          class="file-list__empty"
        >
          暂未选择 STEP 文件。
        </li>
      </ul>
=======
              暂未选择 STEP 文件。
            </li>
          </ul>
        </div>
      </div>
>>>>>>> dev
    </PanelSection>

    <ExportPanel />
  </aside>
</template>
