<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'
import ThreeViewport from '~/components/viewer/ThreeViewport.vue'

const previewModules = [
  {
    title: 'Model Preview Canvas',
    description: 'STEP geometry is parsed, processed, and rendered into the Three.js scene'
  },
  {
    title: 'View Controls',
    description: 'OrbitControls enables rotate, zoom, and pan interactions'
  },
  {
    title: 'Face Selection',
    description: 'Original STEP face ranges are preserved for later manual face selection'
  }
]
</script>

<template>
  <section class="viewer-panel">
    <PanelSection
      title="3D Workspace"
      description="The central area now runs the complete STEP import, face-preserving triangulation mapping, cleanup, normalization, and rendering pipeline."
    >
      <ThreeViewport />

      <div class="workspace-feature-grid">
        <article
          v-for="moduleItem in previewModules"
          :key="moduleItem.title"
          class="workspace-feature-card"
        >
          <h3 class="workspace-feature-card__title">{{ moduleItem.title }}</h3>
          <p class="workspace-feature-card__description">
            {{ moduleItem.description }}
          </p>
        </article>
      </div>
    </PanelSection>
  </section>
</template>
