<script setup lang="ts">
import { computed } from 'vue';
import type { MdButtonProps } from '../../types/components';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdButtonProps>(), {
  variant: 'filled',
  type: 'button',
  disabled: false,
  icon: null,
  fullWidth: false,
});

defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed(() => [
  'md-button',
  `md-button--${props.variant}`,
  { 'md-button--full-width': props.fullWidth },
]);
</script>

<template>
  <button
    :class="classes"
    :type="props.type"
    :disabled="props.disabled"
    @click="$emit('click', $event)"
  >
    <MdIcon v-if="props.icon !== null" :name="props.icon" />
    <span class="md-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.md-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md-sys-spacing-2);
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-6);
  padding-block: var(--md-sys-spacing-2);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  font-weight: var(--md-sys-typescale-weight-medium);
  letter-spacing: var(--md-sys-typescale-tracking-wide);
  cursor: pointer;
  transition-property: background-color, box-shadow;
  transition-duration: var(--md-sys-motion-duration-short4);
  transition-timing-function: var(--md-sys-motion-easing-standard);
}

.md-button--full-width {
  inline-size: 100%;
}

.md-button--filled {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.md-button--tonal {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-button--elevated {
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-primary);
  box-shadow: var(--md-sys-elevation-level1);
}

.md-button--outlined {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  border: 1px solid var(--md-sys-color-outline);
}

.md-button--text {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  padding-inline: var(--md-sys-spacing-3);
}

.md-button:disabled {
  cursor: not-allowed;
  opacity: var(--md-sys-state-disabled-opacity);
  box-shadow: none;
}

.md-button:hover:not(:disabled) {
  box-shadow: var(--md-sys-elevation-level1);
}
</style>
