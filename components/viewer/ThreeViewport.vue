<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useProcessedModelState } from '~/composables/useProcessedModelState'
import { useThreeViewport } from '~/composables/useThreeViewport'

const canvasContainerRef = ref<HTMLDivElement | null>(null)
const { currentModel } = useProcessedModelState()

const currentViewLabel = computed(() => {
  return currentModel.value
    ? `当前查看：${currentModel.value.sourceName}`
    : 'Three.js 运行环境已就绪'
})

const {
  initializeViewport,
  disposeViewport,
  setFrontView
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
    <button
      type="button"
      class="viewer-canvas__view-button"
      aria-label="正视图"
      title="正视图"
      @click="setFrontView"
    >
      正
    </button>

    <div class="viewer-canvas__badge">
      <span class="viewer-canvas__badge-dot" />
      {{ currentViewLabel }}
    </div>

    <div
      v-if="!currentModel"
      class="viewer-canvas__empty"
    >
      <p class="viewer-canvas__empty-title">导入 STEP 文件后开始预览</p>
      <p class="viewer-canvas__empty-hint">
        当前已完成浏览器端 STEP 解析、面映射、几何清理、归一化与渲染环境初始化。
      </p>
    </div>
  </div>
</template>
