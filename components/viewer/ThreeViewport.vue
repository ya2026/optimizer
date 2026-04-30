<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useThreeViewport } from '~/composables/useThreeViewport'

const canvasContainerRef = ref<HTMLDivElement | null>(null)

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
      Three.js Runtime Ready
    </div>
  </div>
</template>
