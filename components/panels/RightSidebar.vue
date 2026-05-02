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
      title="Manual Coloring"
      description="Select a Morandi matte color, then click a STEP face in the viewport to color it. The selected face stays highlighted in red."
    >
      <div class="toggle-card">
        <div>
          <p class="toggle-card__label">Manual Coloring Mode</p>
          <p class="toggle-card__hint">Enable click-to-color while preserving face picking and highlighting</p>
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
        <p class="selection-summary__label">Selected Face</p>
        <p class="selection-summary__value">
          {{ state.selectedFace ? `${state.selectedFace.meshName} / ${state.selectedFace.faceId}` : 'No face selected' }}
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
          :aria-label="`Select color ${color.name}`"
          @click="setSelectedColorId(color.id)"
        />
      </div>

      <button
        type="button"
        class="primary-button"
        @click="requestAutoColor"
      >
        Auto Color Model
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!canSeparateSelectedFace"
        @click="requestFaceSeparation"
      >
        Separate Selected Face
      </button>
    </PanelSection>

    <PanelSection
      title="Export"
      description="Download the full processed model with preserved geometry, materials, Morandi colors, grouping, centering, 1m scale, and normals."
    >
      <div class="export-actions">
        <button
          type="button"
          class="primary-button"
          :disabled="!hasExportableModel"
          @click="exportCurrentModelAsGlb"
        >
          Export GLB
        </button>
      </div>
    </PanelSection>
  </aside>
</template>
