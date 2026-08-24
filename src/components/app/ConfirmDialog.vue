<script setup lang="ts">
import type { ConfirmDialogProps } from '../../types/components';
import MdButton from '../md/MdButton.vue';
import MdDialog from '../md/MdDialog.vue';

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  details: () => [],
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
});

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <MdDialog :open="props.open" :title="props.title" @close="emit('cancel')">
    <p>{{ props.body }}</p>
    <ul v-if="props.details.length > 0" class="confirm-dialog__details">
      <li v-for="detail in props.details" :key="detail">{{ detail }}</li>
    </ul>
    <template #actions>
      <MdButton variant="text" @click="emit('cancel')">{{ props.cancelLabel }}</MdButton>
      <MdButton :variant="props.destructive ? 'filled' : 'tonal'" @click="emit('confirm')">
        {{ props.confirmLabel }}
      </MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.confirm-dialog__details {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
  padding-inline-start: var(--md-sys-spacing-4);
  list-style: disc;
}
</style>
