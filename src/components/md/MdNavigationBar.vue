<script setup lang="ts">
import type { MdNavigationBarProps } from '../../types/components';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdNavigationBarProps>(), { rail: false });
</script>

<template>
  <nav
    class="md-navigation"
    :class="props.rail ? 'md-navigation--rail' : 'md-navigation--bar'"
    aria-label="Primary"
  >
    <RouterLink
      v-for="item in props.items"
      :key="item.to"
      class="md-navigation__item"
      :to="item.to"
      active-class="md-navigation__item--active"
    >
      <MdIcon :name="item.icon" />
      <span class="md-navigation__label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.md-navigation {
  display: flex;
  background-color: var(--md-sys-color-surface-container);
  z-index: var(--md-sys-z-index-navigation);
}

.md-navigation--bar {
  position: sticky;
  inset-block-end: 0;
  justify-content: space-around;
  min-block-size: var(--md-sys-size-navigation-bar);
  padding-block: var(--md-sys-spacing-2);
  padding-inline: var(--md-sys-spacing-1);
  border-block-start: 1px solid var(--md-sys-color-outline-variant);
  padding-block-end: max(var(--md-sys-spacing-2), env(safe-area-inset-bottom));
}

.md-navigation--rail {
  position: sticky;
  inset-block-start: 0;
  flex-direction: column;
  align-items: center;
  gap: var(--md-sys-spacing-6);
  inline-size: var(--md-sys-size-navigation-rail);
  block-size: 100vh;
  padding-block: var(--md-sys-spacing-4);
  border-inline-end: 1px solid var(--md-sys-color-outline-variant);
}

.md-navigation__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md-sys-spacing-1);
  min-inline-size: var(--md-sys-size-touch-target);
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-2);
  padding-block: var(--md-sys-spacing-1);
  border-radius: var(--md-sys-shape-corner-medium);
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
}

.md-navigation__item--active {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-navigation__label {
  font-size: var(--md-sys-typescale-label-medium-size);
  line-height: var(--md-sys-typescale-label-medium-line-height);
  font-weight: var(--md-sys-typescale-weight-medium);
}
</style>
