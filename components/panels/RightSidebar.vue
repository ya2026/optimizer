<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'
import { useMorandiPalette } from '~/composables/useMorandiPalette'
import { useFaceInteractionState } from '~/composables/useFaceInteractionState'
import { useModelExport } from '~/composables/useModelExport'

const { morandiColors } = useMorandiPalette()
const {
  state,
  canSeparateSelectedFace,
  setManualColoringEnabled,
  setSelectedColorId,
  requestFaceSeparation,
  requestAutoColor
} = useFaceInteractionState()
const {
  exportCurrentModelAsGlb,
  hasExportableModel
} = useModelExport()
</script>

<template>
  <aside class="sidebar-panel">
    <PanelSection
      title="手动着色"
      description="选择一个莫兰迪颜色后，点击视口中的 STEP 面即可着色，当前选中面会保持红色高亮。"
    >
      <div class="toggle-card">
        <div>
          <p class="toggle-card__label">手动着色模式</p>
          <p class="toggle-card__hint">开启后可在保留选面与高亮能力的同时，点击面直接着色</p>
        </div>

        <label class="switch">
          <input
            :checked="state.manualColoringEnabled"
            type="checkbox"
            @change="setManualColoringEnabled(($event.target as HTMLInputElement).checked)"
          >
          <span class="switch__slider" />
        </label>
      </div>

      <div class="selection-summary">
        <p class="selection-summary__label">当前选中面</p>
        <p class="selection-summary__value">
          {{ state.selectedFace ? `${state.selectedFace.meshName} / ${state.selectedFace.faceId}` : '未选择任何面' }}
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
  </aside>
</template>
