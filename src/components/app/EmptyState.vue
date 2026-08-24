<script setup lang="ts">
import type { EmptyStateProps } from '../../types/components';
import MdIcon from '../md/MdIcon.vue';

const props = defineProps<EmptyStateProps>();
</script>

<template>
  <div class="empty-state">
    <MdIcon :name="props.icon" class="empty-state__icon" />
    <p class="empty-state__title">{{ props.title }}</p>
    <p class="empty-state__body">{{ props.body }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md-sys-spacing-2);
  padding-block: var(--md-sys-spacing-12);
  padding-inline: var(--md-sys-spacing-4);
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-state__icon {
  font-size: var(--md-sys-typescale-headline-large-size);
}

.empty-state__title {
  font-size: var(--md-sys-typescale-title-medium-size);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  color: var(--md-sys-color-on-surface);
}

.empty-state__body {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  max-inline-size: 28rem;
}
</style>
