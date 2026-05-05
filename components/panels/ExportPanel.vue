<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'
import { useModelExport } from '~/composables/useModelExport'

const {
  exportCurrentModelAsGlb,
  exportCurrentModelAsFbx,
  exportBatchModelsAsGlb,
  exportBatchModelsAsFbx,
  hasExportableModel,
  hasBatchExportableModels,
  isBatchExporting
} = useModelExport()
</script>

<template>
  <PanelSection title="导出">
    <div class="export-actions">
      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasExportableModel || isBatchExporting"
        @click="exportCurrentModelAsGlb"
      >
        导出 GLB
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasExportableModel || isBatchExporting"
        @click="exportCurrentModelAsFbx"
      >
        导出 FBX
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasBatchExportableModels || isBatchExporting"
        @click="exportBatchModelsAsGlb"
      >
        批量导出 GLB
      </button>

      <button
        type="button"
        class="primary-button primary-button--secondary"
        :disabled="!hasBatchExportableModels || isBatchExporting"
        @click="exportBatchModelsAsFbx"
      >
        批量导出 FBX
      </button>
    </div>
  </PanelSection>
</template>
