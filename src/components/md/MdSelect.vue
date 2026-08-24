<script setup lang="ts">
import { computed, useId } from 'vue';
import type { MdSelectProps } from '../../types/components';

const props = withDefaults(defineProps<MdSelectProps>(), {
  disabled: false,
  supportingText: '',
  errorText: '',
});

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const fieldId = useId();
const supportId = `${fieldId}-support`;
const hasError = computed(() => props.errorText.length > 0);
const supportMessage = computed(() => (hasError.value ? props.errorText : props.supportingText));

function onChange(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLSelectElement) {
    emit('update:modelValue', target.value);
  }
}
</script>

<template>
  <div class="md-select" :class="{ 'md-select--error': hasError }">
    <label class="md-select__label" :for="fieldId">{{ props.label }}</label>
    <select
      :id="fieldId"
      class="md-select__input"
      :value="props.modelValue"
      :disabled="props.disabled"
      :aria-invalid="hasError"
      :aria-describedby="supportMessage === '' ? undefined : supportId"
      @change="onChange"
    >
      <option v-for="option in props.options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="supportMessage !== ''" :id="supportId" class="md-select__support">
      {{ supportMessage }}
    </p>
  </div>
</template>

<style scoped>
.md-select {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
  inline-size: 100%;
}

.md-select__label {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-select__input {
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-2);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
}

.md-select__input:disabled {
  opacity: var(--md-sys-state-disabled-opacity);
  cursor: not-allowed;
}

.md-select--error .md-select__input {
  border-color: var(--md-sys-color-error);
}

.md-select__support {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-select--error .md-select__support {
  color: var(--md-sys-color-error);
}
</style>
