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
      <span>X {{ rotationState.x }}°</span>
      <span>Y {{ rotationState.y }}°</span>
      <span>Z {{ rotationState.z }}°</span>
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
