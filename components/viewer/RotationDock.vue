<script setup lang="ts">
import { useModelTransform } from '~/composables/useModelTransform'

const {
  rotateCurrentModel,
  rotationState,
  hasTransformableModel
} = useModelTransform()
</script>

<template>
  <section class="rotation-dock">
    <div class="rotation-dock__header">
      <h3 class="rotation-dock__title">
        模型旋转
      </h3>
      <p class="rotation-dock__description">
        沿 X、Y、Z 轴分别旋转正负 90 度
      </p>
    </div>

    <div class="rotation-dock__angles">
      <span class="rotation-dock__angle-pill">
        <span class="rotation-dock__angle-axis">X</span>
        <span class="rotation-dock__angle-value">{{ rotationState.x }}°</span>
      </span>
      <span class="rotation-dock__angle-pill">
        <span class="rotation-dock__angle-axis">Y</span>
        <span class="rotation-dock__angle-value">{{ rotationState.y }}°</span>
      </span>
      <span class="rotation-dock__angle-pill">
        <span class="rotation-dock__angle-axis">Z</span>
        <span class="rotation-dock__angle-value">{{ rotationState.z }}°</span>
      </span>
    </div>

    <div class="rotation-grid">
      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasTransformableModel"
        @click="rotateCurrentModel('x', 90)"
      >
        X +90°
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasTransformableModel"
        @click="rotateCurrentModel('x', -90)"
      >
        X -90°
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasTransformableModel"
        @click="rotateCurrentModel('y', 90)"
      >
        Y +90°
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasTransformableModel"
        @click="rotateCurrentModel('y', -90)"
      >
        Y -90°
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasTransformableModel"
        @click="rotateCurrentModel('z', 90)"
      >
        Z +90°
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasTransformableModel"
        @click="rotateCurrentModel('z', -90)"
      >
        Z -90°
      </button>
    </div>
  </section>
</template>
