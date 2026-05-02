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
  requestAutoColor
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
</script>

<template>
  <aside class="sidebar-panel sidebar-panel--right">
    <PanelSection
      class="sidebar-panel__stretch"
      title="手动着色"
      description="提供 8 个按赤橙黄绿青蓝靛紫排列的低饱和色盘。导入后模型会自动配色，开启手动模式后可继续点击面替换颜色。"
    >
      <div class="toggle-card">
        <div>
          <p class="toggle-card__label">手动着色模式</p>
          <p class="toggle-card__status">
            {{ manualColoringStatusText }}
          </p>
          <p class="toggle-card__hint">开启后点击模型面会直接改色并保留同色高亮；关闭后点击仅用于红色高亮选面</p>
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
  </aside>
</template>
