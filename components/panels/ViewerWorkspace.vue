<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'
import ThreeViewport from '~/components/viewer/ThreeViewport.vue'

const previewModules = [
  {
    title: 'Model Preview Canvas',
    description: 'Scene, camera, renderer, controls, and lighting are initialized'
  },
  {
    title: 'View Controls',
    description: 'OrbitControls enables rotate, zoom, and pan interactions'
  },
  {
    title: 'Face Selection',
    description: 'Reserve face picking and highlight container'
  }
]
</script>

<template>
  <section class="viewer-panel">
    <PanelSection
      title="3D Workspace"
      description="The central area now includes the basic Three.js runtime and keeps placeholders for the next model workflow steps."
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
