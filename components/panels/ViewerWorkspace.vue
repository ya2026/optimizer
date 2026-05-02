<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'
import ThreeViewport from '~/components/viewer/ThreeViewport.vue'
import RotationDock from '~/components/viewer/RotationDock.vue'
</script>

<template>
  <section class="viewer-panel">
    <PanelSection title="三维工作区">
      <div class="viewer-stage">
        <ThreeViewport />
        <RotationDock />
      </div>
    </PanelSection>
  </section>
</template>
