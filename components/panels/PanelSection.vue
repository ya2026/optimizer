<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="panel-section">
    <header class="panel-section__header">
      <h2 class="panel-section__title">{{ title }}</h2>
      <p
        v-if="description"
        class="panel-section__description"
      >
        {{ description }}
      </p>
    </header>

    <div class="panel-section__content">
      <slot />
    </div>
  </section>
</template>
