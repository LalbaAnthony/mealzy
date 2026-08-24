<script setup lang="ts">
import { computed } from 'vue';
import type { MdIconButtonProps } from '../../types/components';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdIconButtonProps>(), {
  variant: 'standard',
  disabled: false,
  selected: false,
});

defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed(() => [
  'md-icon-button',
  `md-icon-button--${props.variant}`,
  { 'md-icon-button--selected': props.selected },
]);
</script>

<template>
  <button
    :class="classes"
    type="button"
    :disabled="props.disabled"
    :aria-label="props.label"
    :aria-pressed="props.selected"
    :title="props.label"
    @click="$emit('click', $event)"
  >
    <MdIcon :name="props.icon" />
  </button>
</template>

<style scoped>
.md-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--md-sys-size-touch-target);
  block-size: var(--md-sys-size-touch-target);
  padding: var(--md-sys-spacing-0);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  transition-property: background-color, color;
  transition-duration: var(--md-sys-motion-duration-short4);
  transition-timing-function: var(--md-sys-motion-easing-standard);
}

.md-icon-button--filled {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.md-icon-button--tonal {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-icon-button--selected {
  color: var(--md-sys-color-primary);
}

.md-icon-button:disabled {
  cursor: not-allowed;
  opacity: var(--md-sys-state-disabled-opacity);
}

.md-icon-button:hover:not(:disabled) {
  background-color: var(--md-sys-color-surface-container-high);
}
</style>
