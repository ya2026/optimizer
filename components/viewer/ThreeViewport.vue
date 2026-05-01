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
      {{ activeFile ? `Viewing: ${activeFile.name}` : 'Three.js Runtime Ready' }}
    </div>

    <div
      v-if="!activeFile"
      class="viewer-canvas__empty"
    >
      <p class="viewer-canvas__empty-title">Import a STEP file to start</p>
      <p class="viewer-canvas__empty-hint">
        The full browser-side STEP parsing, face mapping, cleanup, normalization, and rendering pipeline is ready.
      </p>
    </div>
  </div>
</template>
