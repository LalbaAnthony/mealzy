<script setup lang="ts">
import { useId } from 'vue';
import type { MdCheckboxProps } from '../../types/components';

const props = withDefaults(defineProps<MdCheckboxProps>(), {
  disabled: false,
  hideLabel: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const fieldId = useId();

function onChange(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit('update:modelValue', target.checked);
  }
}
</script>

<template>
  <div class="md-checkbox">
    <input
      :id="fieldId"
      class="md-checkbox__input"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-label="props.hideLabel ? props.label : undefined"
      @change="onChange"
    />
    <label v-if="!props.hideLabel" class="md-checkbox__label" :for="fieldId">
      {{ props.label }}
    </label>
  </div>
</template>

<style scoped>
.md-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--md-sys-spacing-3);
  min-block-size: var(--md-sys-size-touch-target);
}

.md-checkbox__input {
  inline-size: var(--md-sys-size-icon);
  block-size: var(--md-sys-size-icon);
  accent-color: var(--md-sys-color-primary);
  cursor: pointer;
  flex: none;
}

.md-checkbox__input:disabled {
  cursor: not-allowed;
  opacity: var(--md-sys-state-disabled-opacity);
}

.md-checkbox__label {
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
}
</style>
