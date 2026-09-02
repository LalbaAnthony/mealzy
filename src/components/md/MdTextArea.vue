<script setup lang="ts">
import { computed, useId } from 'vue';
import type { MdTextAreaProps } from '../../types/components';

const props = withDefaults(defineProps<MdTextAreaProps>(), {
  placeholder: '',
  disabled: false,
  required: false,
  supportingText: '',
  errorText: '',
  rows: 4,
});

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const fieldId = useId();
const supportId = `${fieldId}-support`;
const hasError = computed(() => props.errorText.length > 0);
const supportMessage = computed(() => (hasError.value ? props.errorText : props.supportingText));

function onInput(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit('update:modelValue', target.value);
  }
}
</script>

<template>
  <div class="md-text-area" :class="{ 'md-text-area--error': hasError }">
    <label class="md-text-area__label" :for="fieldId">{{ props.label }}</label>
    <textarea
      :id="fieldId"
      class="md-text-area__input"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :required="props.required"
      :rows="props.rows"
      :aria-invalid="hasError"
      :aria-describedby="supportMessage === '' ? undefined : supportId"
      @input="onInput"
    ></textarea>
    <p v-if="supportMessage !== ''" :id="supportId" class="md-text-area__support">
      {{ supportMessage }}
    </p>
  </div>
</template>

<style scoped>
.md-text-area {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
  inline-size: 100%;
}

.md-text-area__label {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-text-area__input {
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-2);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  font-family: inherit;
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  resize: vertical;
}

.md-text-area__input:disabled {
  opacity: var(--md-sys-state-disabled-opacity);
  cursor: not-allowed;
}

.md-text-area--error .md-text-area__input {
  border-color: var(--md-sys-color-error);
}

.md-text-area__support {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-text-area--error .md-text-area__support {
  color: var(--md-sys-color-error);
}
</style>
