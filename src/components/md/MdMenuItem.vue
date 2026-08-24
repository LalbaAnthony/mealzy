<script setup lang="ts">
import type { MdMenuItemProps } from '../../types/components';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdMenuItemProps>(), {
  icon: null,
  destructive: false,
  disabled: false,
});

defineEmits<{ select: [] }>();
</script>

<template>
  <li role="none">
    <button
      class="md-menu-item"
      :class="{ 'md-menu-item--destructive': props.destructive }"
      type="button"
      role="menuitem"
      :disabled="props.disabled"
      @click="$emit('select')"
    >
      <MdIcon v-if="props.icon !== null" :name="props.icon" />
      <span>{{ props.label }}</span>
    </button>
  </li>
</template>

<style scoped>
.md-menu-item {
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-3);
  inline-size: 100%;
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-2);
  border: none;
  background-color: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  text-align: start;
  cursor: pointer;
}

.md-menu-item--destructive {
  color: var(--md-sys-color-error);
}

.md-menu-item:disabled {
  cursor: not-allowed;
  opacity: var(--md-sys-state-disabled-opacity);
}

.md-menu-item:hover:not(:disabled) {
  background-color: var(--md-sys-color-surface-container-highest);
}
</style>
