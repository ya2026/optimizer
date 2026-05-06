<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'
import RotationDock from '~/components/viewer/RotationDock.vue'
import ThreeViewport from '~/components/viewer/ThreeViewport.vue'
</script>

<template>
  <section class="viewer-panel">
    <PanelSection title="三维预览工作台">
      <div class="viewer-stage">
        <ThreeViewport />
        <RotationDock />
      </div>
    </PanelSection>
  </section>
</template>
