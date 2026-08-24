<script setup lang="ts">
import type { MdListProps } from '../../types/components';

const props = withDefaults(defineProps<MdListProps>(), { label: '' });
</script>

<template>
  <ul class="md-list" :aria-label="props.label === '' ? undefined : props.label">
    <slot />
  </ul>
</template>

<style scoped>
.md-list {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
}
</style>
