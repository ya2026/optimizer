<script setup lang="ts">
import { computed } from 'vue'
import PanelSection from '~/components/panels/PanelSection.vue'
import { useMorandiPalette } from '~/composables/useMorandiPalette'
import { useFaceInteractionState } from '~/composables/useFaceInteractionState'

const { morandiColors } = useMorandiPalette()
const {
  state,
  canSeparateSelectedFace,
  setManualColoringEnabled,
  setSelectedColorId,
  requestFaceSeparation,
  requestAutoColor,
  requestSaveColors
} = useFaceInteractionState()

const manualColoringEnabled = computed({
  get: () => state.value.manualColoringEnabled,
  set: (enabled: boolean) => {
    setManualColoringEnabled(enabled)
  }
})

const manualColoringStatusText = computed(() => {
  return manualColoringEnabled.value ? '已开启' : '已关闭'
})

const selectedFaceText = computed(() => {
  if (!state.value.selectedFace) {
    return '未选择任何面'
  }

  return `${state.value.selectedFace.meshName} / ${state.value.selectedFace.faceId}`
})
</script>

<template>
  <aside class="sidebar-panel sidebar-panel--right">
    <PanelSection
<<<<<<< HEAD
      title="手动着色"
      description="选择一个莫兰迪颜色后，点击视口中的 STEP 面即可着色，当前选中面会保持红色高亮。"
    >
      <div class="toggle-card">
        <div>
          <p class="toggle-card__label">手动着色模式</p>
          <p class="toggle-card__hint">开启后可在保留选面与高亮能力的同时，点击面直接着色</p>
=======
      class="sidebar-panel__stretch"
      title="手动着色"
    >
      <div class="toggle-card">
        <div class="toggle-card__content">
          <p class="toggle-card__label">手动着色模式</p>
          <p class="toggle-card__status">
            {{ manualColoringStatusText }}
          </p>
          <p class="toggle-card__hint">
            开启后，点击模型面会直接应用当前颜色；关闭后，点击仅用于高亮选面。
          </p>
>>>>>>> dev
        </div>

        <label class="switch">
          <input
            v-model="manualColoringEnabled"
            type="checkbox"
          >
          <span class="switch__slider" />
        </label>
      </div>

      <div class="selection-summary">
        <p class="selection-summary__label">当前选中面</p>
        <p class="selection-summary__value">
<<<<<<< HEAD
          {{ state.selectedFace ? `${state.selectedFace.meshName} / ${state.selectedFace.faceId}` : '未选择任何面' }}
=======
          {{ selectedFaceText }}
>>>>>>> dev
        </p>
      </div>

      <div class="color-grid">
        <button
          v-for="color in morandiColors"
          :key="color.id"
          type="button"
          class="color-swatch"
          :class="{ 'color-swatch--active': state.selectedColorId === color.id }"
          :style="{ backgroundColor: color.hex }"
          :aria-label="`选择颜色：${color.name}`"
          @click="setSelectedColorId(color.id)"
        />
      </div>

      <button
        type="button"
        class="primary-button"
        @click="requestAutoColor"
      >
        整体自动配色
<<<<<<< HEAD
=======
      </button>

      <button
        type="button"
        class="primary-button"
        @click="requestSaveColors"
      >
        保存着色
>>>>>>> dev
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!canSeparateSelectedFace"
        @click="requestFaceSeparation"
      >
        分离当前选中面
      </button>
    </PanelSection>
<<<<<<< HEAD

    <PanelSection
      title="导出"
      description="直接下载完整处理后的模型，并保留几何、材质、莫兰迪颜色、分组、居中、1 米尺度和法线结果。"
    >
      <div class="export-actions">
        <button
          type="button"
          class="primary-button"
          :disabled="!hasExportableModel"
          @click="exportCurrentModelAsGlb"
        >
          导出 GLB
        </button>
      </div>
    </PanelSection>
=======
>>>>>>> dev
  </aside>
</template>
