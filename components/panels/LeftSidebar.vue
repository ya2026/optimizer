<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'

const stepFiles = [
  'housing-top.step',
  'bearing-support.stp',
  'assembly-v12.step',
  'fixture-plate.stp'
]
</script>

<template>
  <aside class="sidebar-panel">
    <PanelSection
      title="File Operations"
      description="Reserve the local import entry and file list area for batch STEP file management."
    >
      <div class="action-card-list">
        <button
          type="button"
          class="action-card"
        >
          <span class="action-card__title">Select Local Folder</span>
          <span class="action-card__hint">Directory picker placeholder</span>
        </button>

        <button
          type="button"
          class="action-card"
        >
          <span class="action-card__title">Import STEP Files</span>
          <span class="action-card__hint">Batch file selection placeholder</span>
        </button>
      </div>
    </PanelSection>

    <PanelSection
      title="Model File List"
      description="Only the static structure is displayed now. Actual import state will be connected later."
    >
      <ul class="file-list">
        <li
          v-for="fileName in stepFiles"
          :key="fileName"
          class="file-list__item"
        >
          <span class="file-list__name">{{ fileName }}</span>
          <span class="file-list__tag">STEP</span>
        </li>
      </ul>
    </PanelSection>
  </aside>
</template>
