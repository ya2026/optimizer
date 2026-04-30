<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import LeftSidebar from '~/components/panels/LeftSidebar.vue'
import ViewerWorkspace from '~/components/panels/ViewerWorkspace.vue'
import RightSidebar from '~/components/panels/RightSidebar.vue'
</script>

<template>
  <div class="page-shell">
    <AppHeader />

    <main class="workspace-layout">
      <LeftSidebar />
      <ViewerWorkspace />
      <RightSidebar />
    </main>
  </div>
</template>
