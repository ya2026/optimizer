<script setup lang="ts">
import { computed } from 'vue'
import PanelSection from '~/components/panels/PanelSection.vue'
import { useFaceInteractionState } from '~/composables/useFaceInteractionState'
import { useMorandiPalette } from '~/composables/useMorandiPalette'

const { morandiColors } = useMorandiPalette()
const {
  state,
  setManualColoringEnabled,
  setSelectedColorId,
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
      class="sidebar-panel__stretch"
      title="手动着色"
    >
      <div class="toggle-card">
        <div class="toggle-card__content">
          <p class="toggle-card__label">手动着色模式</p>
          <p class="toggle-card__status">{{ manualColoringStatusText }}</p>
          <p class="toggle-card__hint">
            开启后，点击模型面会直接应用当前颜色；关闭后，点击仅用于高亮选面。
          </p>
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
        <p class="selection-summary__value">{{ selectedFaceText }}</p>
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
        class="primary-button"
        @click="requestSaveColors"
      >
        保存着色
      </button>
    </PanelSection>
  </aside>
</template>
