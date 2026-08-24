<script setup lang="ts">
import type { StorageUnavailableProps } from '../types/components';

const props = defineProps<StorageUnavailableProps>();
</script>

<template>
  <main class="storage-unavailable">
    <h1 class="storage-unavailable__title">Mealzy cannot start</h1>
    <p class="storage-unavailable__body">{{ props.message }}</p>
    <p class="storage-unavailable__body">
      All data lives in this browser. Without local storage there is nowhere to keep your recipes
      and meals. Try a normal browsing window, or allow site data for this site.
    </p>
  </main>
</template>

<style scoped>
.storage-unavailable {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  max-inline-size: 32rem;
  margin-inline: auto;
  padding: var(--md-sys-spacing-8);
  color: var(--md-sys-color-on-background);
}

.storage-unavailable__title {
  font-size: var(--md-sys-typescale-headline-small-size);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  font-weight: var(--md-sys-typescale-weight-regular);
}

.storage-unavailable__body {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
