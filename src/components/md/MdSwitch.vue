<script setup lang="ts">
import { useId } from 'vue';
import type { MdSwitchProps } from '../../types/components';

const props = withDefaults(defineProps<MdSwitchProps>(), { disabled: false });

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const fieldId = useId();

function toggle(): void {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<template>
  <div class="md-switch">
    <label class="md-switch__label" :for="fieldId">{{ props.label }}</label>
    <button
      :id="fieldId"
      class="md-switch__track"
      :class="{ 'md-switch__track--on': props.modelValue }"
      type="button"
      role="switch"
      :aria-checked="props.modelValue"
      :disabled="props.disabled"
      @click="toggle"
    >
      <span class="md-switch__thumb" />
    </button>
  </div>
</template>

<style scoped>
.md-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-sys-spacing-4);
  min-block-size: var(--md-sys-size-touch-target);
}

.md-switch__label {
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  color: var(--md-sys-color-on-surface);
}

.md-switch__track {
  position: relative;
  inline-size: 3.25rem;
  block-size: 2rem;
  padding: var(--md-sys-spacing-0);
  border: 2px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  cursor: pointer;
  flex: none;
  transition-property: background-color, border-color;
  transition-duration: var(--md-sys-motion-duration-short4);
  transition-timing-function: var(--md-sys-motion-easing-standard);
}

.md-switch__track--on {
  background-color: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.md-switch__track:disabled {
  cursor: not-allowed;
  opacity: var(--md-sys-state-disabled-opacity);
}

.md-switch__thumb {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0.25rem;
  inline-size: 1rem;
  block-size: 1rem;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-outline);
  transform: translateY(-50%);
  transition-property: inset-inline-start, background-color, inline-size, block-size;
  transition-duration: var(--md-sys-motion-duration-short4);
  transition-timing-function: var(--md-sys-motion-easing-standard);
}

.md-switch__track--on .md-switch__thumb {
  inset-inline-start: 1.5rem;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  background-color: var(--md-sys-color-on-primary);
}
</style>
