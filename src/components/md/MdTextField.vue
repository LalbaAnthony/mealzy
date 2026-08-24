<script setup lang="ts">
import { computed, useId } from 'vue';
import type { MdTextFieldProps } from '../../types/components';

const props = withDefaults(defineProps<MdTextFieldProps>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
  supportingText: '',
  errorText: '',
  min: '',
  step: '',
});

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const fieldId = useId();
const supportId = `${fieldId}-support`;
const hasError = computed(() => props.errorText.length > 0);
const supportMessage = computed(() => (hasError.value ? props.errorText : props.supportingText));

function onInput(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit('update:modelValue', target.value);
  }
}
</script>

<template>
  <div class="md-text-field" :class="{ 'md-text-field--error': hasError }">
    <label class="md-text-field__label" :for="fieldId">{{ props.label }}</label>
    <input
      :id="fieldId"
      class="md-text-field__input"
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :required="props.required"
      :min="props.min === '' ? undefined : props.min"
      :step="props.step === '' ? undefined : props.step"
      :aria-invalid="hasError"
      :aria-describedby="supportMessage === '' ? undefined : supportId"
      @input="onInput"
    />
    <p v-if="supportMessage !== ''" :id="supportId" class="md-text-field__support">
      {{ supportMessage }}
    </p>
  </div>
</template>

<style scoped>
.md-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
  inline-size: 100%;
}

.md-text-field__label {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-text-field__input {
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

.md-text-field__input:disabled {
  opacity: var(--md-sys-state-disabled-opacity);
  cursor: not-allowed;
}

.md-text-field--error .md-text-field__input {
  border-color: var(--md-sys-color-error);
}

.md-text-field__support {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-text-field--error .md-text-field__support {
  color: var(--md-sys-color-error);
}
</style>
