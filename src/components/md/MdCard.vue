<script setup lang="ts">
import type { MdCardProps } from '../../types/components';

const props = withDefaults(defineProps<MdCardProps>(), { variant: 'filled' });
</script>

<template>
  <section class="md-card" :class="`md-card--${props.variant}`">
    <slot />
  </section>
</template>

<style scoped>
.md-card {
  border-radius: var(--md-sys-shape-corner-medium);
  padding: var(--md-sys-spacing-4);
  color: var(--md-sys-color-on-surface);
}

.md-card--filled {
  background-color: var(--md-sys-color-surface-container-low);
}

.md-card--elevated {
  background-color: var(--md-sys-color-surface-container-low);
  box-shadow: var(--md-sys-elevation-level1);
}

.md-card--outlined {
  background-color: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
}
</style>
