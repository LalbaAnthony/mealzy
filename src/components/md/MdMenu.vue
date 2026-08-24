<script setup lang="ts">
import type { MdMenuProps } from '../../types/components';

const props = defineProps<MdMenuProps>();

const emit = defineEmits<{ close: [] }>();

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  }
}
</script>

<template>
  <div class="md-menu">
    <slot name="trigger" />
    <div v-if="props.open" class="md-menu__backdrop" @click="emit('close')" />
    <ul
      v-if="props.open"
      class="md-menu__list"
      role="menu"
      :aria-label="props.label"
      @keydown="onKeydown"
    >
      <slot />
    </ul>
  </div>
</template>

<style scoped>
.md-menu {
  position: relative;
  display: inline-flex;
}

.md-menu__backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--md-sys-z-index-menu);
}

.md-menu__list {
  position: absolute;
  inset-block-start: 100%;
  inset-inline-end: 0;
  min-inline-size: 12rem;
  padding-block: var(--md-sys-spacing-2);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: var(--md-sys-elevation-level2);
  z-index: var(--md-sys-z-index-menu);
}
</style>
