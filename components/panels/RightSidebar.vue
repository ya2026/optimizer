<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'

const morandiColors = [
  '#b7a99a',
  '#d5c4b3',
  '#c7c0b4',
  '#aeb7b3',
  '#8fa3a6',
  '#9d8f87',
  '#6f7d80'
]
</script>

<template>
  <aside class="sidebar-panel">
    <PanelSection
      title="Manual Coloring"
      description="Keep only the manual coloring entry. Automatic model cleanup and preprocessing will be completed after import."
    >
      <div class="toggle-card">
        <div>
          <p class="toggle-card__label">Manual Coloring Mode</p>
          <p class="toggle-card__hint">UI placeholder without interaction logic</p>
        </div>

        <label class="switch">
          <input type="checkbox">
          <span class="switch__slider" />
        </label>
      </div>

      <div class="color-grid">
        <button
          v-for="color in morandiColors"
          :key="color"
          type="button"
          class="color-swatch"
          :style="{ backgroundColor: color }"
          :aria-label="`Select color ${color}`"
        />
      </div>
    </PanelSection>

    <PanelSection
      title="Export"
      description="Keep independent export entries for GLB and FBX outputs."
    >
      <div class="export-actions">
        <button
          type="button"
          class="primary-button"
        >
          Export GLB
        </button>

        <button
          type="button"
          class="primary-button primary-button--secondary"
        >
          Export FBX
        </button>
      </div>
    </PanelSection>
  </aside>
</template>
