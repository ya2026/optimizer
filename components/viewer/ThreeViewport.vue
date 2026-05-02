<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useThreeViewport } from '~/composables/useThreeViewport'
import { useStepImportState } from '~/composables/useStepImportState'

const canvasContainerRef = ref<HTMLDivElement | null>(null)
const { activeFile } = useStepImportState()

const {
  initializeViewport,
  disposeViewport
} = useThreeViewport(canvasContainerRef)

onMounted(() => {
  initializeViewport()
})

onBeforeUnmount(() => {
  disposeViewport()
})
</script>

<template>
  <div
    ref="canvasContainerRef"
    class="viewer-canvas"
  >
    <div class="viewer-canvas__badge">
      <span class="viewer-canvas__badge-dot" />
      {{ activeFile ? `当前查看：${activeFile.name}` : 'Three.js 运行环境已就绪' }}
    </div>

    <div
      v-if="!activeFile"
      class="viewer-canvas__empty"
    >
      <p class="viewer-canvas__empty-title">导入 STEP 文件后开始预览</p>
    </div>
  </div>
</template>
