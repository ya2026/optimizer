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
</script>

<template>
  <aside class="sidebar-panel">
    <PanelSection
      title="文件操作"
      description="提供本地文件夹选择、STEP 文件导入以及批量模型管理入口。"
    >
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
          <span class="action-card__hint">导入一个或多个 `.step` 或 `.stp` 文件</span>
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
      title="模型文件列表"
      description="这里会展示已导入的 STEP 文件，点击后会在中间视口中完成处理并显示。"
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

          <span class="file-list__tag">STEP</span>
        </li>

        <li
          v-if="!state.files.length"
          class="file-list__empty"
        >
          暂未选择 STEP 文件。
        </li>
      </ul>
    </PanelSection>
  </aside>
</template>
