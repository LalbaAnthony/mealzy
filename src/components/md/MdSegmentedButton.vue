<script setup lang="ts">
import type { MdSegmentedButtonProps } from '../../types/components';
import MdIcon from './MdIcon.vue';

const props = defineProps<MdSegmentedButtonProps>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function select(value: string): void {
  emit('update:modelValue', value);
}
</script>

<template>
  <div class="md-segmented" role="group" :aria-label="props.label">
    <button
      v-for="option in props.options"
      :key="option.value"
      class="md-segmented__option"
      :class="{ 'md-segmented__option--selected': option.value === props.modelValue }"
      type="button"
      :aria-pressed="option.value === props.modelValue"
      @click="select(option.value)"
    >
      <MdIcon v-if="option.icon !== null" :name="option.icon" class="md-segmented__icon" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.md-segmented {
  display: inline-flex;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-full);
  overflow: hidden;
}

.md-segmented__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md-sys-spacing-2);
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-2);
  border: none;
  background-color: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  cursor: pointer;
}

.md-segmented__option + .md-segmented__option {
  border-inline-start: 1px solid var(--md-sys-color-outline);
}

.md-segmented__option--selected {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-segmented__icon {
  font-size: var(--md-sys-typescale-body-large-size);
}
</style>
