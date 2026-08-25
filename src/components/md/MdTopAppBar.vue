<script setup lang="ts">
import type { MdTopAppBarProps } from '../../types/components';

const props = defineProps<MdTopAppBarProps>();
</script>

<template>
  <header class="md-top-app-bar">
    <div v-if="$slots.leading" class="md-top-app-bar__leading">
      <slot name="leading" />
    </div>
    <h1 class="md-top-app-bar__title">{{ props.title }}</h1>
    <div class="md-top-app-bar__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.md-top-app-bar {
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-2);
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-2);
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  z-index: var(--md-sys-z-index-app-bar);
}

.md-top-app-bar__title {
  flex: 1 1 auto;
  min-inline-size: 0;
  font-size: var(--md-sys-typescale-title-large-size);
  line-height: var(--md-sys-typescale-title-large-line-height);
  font-weight: var(--md-sys-typescale-weight-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.md-top-app-bar__actions,
.md-top-app-bar__leading {
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-1);
  flex: none;
}
</style>
