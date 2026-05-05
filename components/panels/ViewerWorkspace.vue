<script setup lang="ts">
import PanelSection from '~/components/panels/PanelSection.vue'
import ThreeViewport from '~/components/viewer/ThreeViewport.vue'
<<<<<<< HEAD

const previewModules = [
  {
    title: '模型预览画布',
    description: 'STEP 几何体会在这里完成解析、处理并渲染到 Three.js 场景中'
  },
  {
    title: '视图控制',
    description: '通过 OrbitControls 支持旋转、缩放与平移操作'
  },
  {
    title: '面选择',
    description: '保留原始 STEP 面映射关系，供后续手动选面与着色使用'
  }
]
=======
import RotationDock from '~/components/viewer/RotationDock.vue'
>>>>>>> dev
</script>

<template>
  <section class="viewer-panel">
<<<<<<< HEAD
    <PanelSection
      title="三维工作区"
      description="中间区域承载完整的 STEP 导入、保面三角化映射、清理、归一化与渲染流程。"
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
=======
    <PanelSection title="三维工作区">
      <div class="viewer-stage">
        <ThreeViewport />
        <RotationDock />
>>>>>>> dev
      </div>
    </PanelSection>
  </section>
</template>
