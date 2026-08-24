<script setup lang="ts">
import type { QuantityFieldProps } from '../../types/components';
import { useUnitOptions } from '../../composables/useUnitOptions';
import MdSelect from '../md/MdSelect.vue';
import MdTextField from '../md/MdTextField.vue';

const props = defineProps<QuantityFieldProps>();

const emit = defineEmits<{
  'update:amount': [value: string];
  'update:unit': [value: string];
}>();

const { unitOptions } = useUnitOptions();
</script>

<template>
  <div class="quantity-field">
    <MdTextField
      :model-value="props.amount"
      :label="props.label"
      type="number"
      min="0"
      step="any"
      placeholder="Any amount"
      supporting-text="Leave empty for an unspecified amount"
      @update:model-value="emit('update:amount', $event)"
    />
    <MdSelect
      :model-value="props.unit"
      label="Unit"
      :options="unitOptions"
      @update:model-value="emit('update:unit', $event)"
    />
  </div>
</template>

<style scoped>
.quantity-field {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md-sys-spacing-3);
}

@media (min-width: 600px) {
  .quantity-field {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }
}
</style>
