<script setup lang="ts">
import type { MdSnackbarProps } from '../../types/components';
import MdButton from './MdButton.vue';

const props = withDefaults(defineProps<MdSnackbarProps>(), {
  tone: 'neutral',
  actionLabel: '',
});

defineEmits<{ action: [] }>();
</script>

<template>
  <div class="md-snackbar" :class="`md-snackbar--${props.tone}`">
    <p class="md-snackbar__message">{{ props.message }}</p>
    <MdButton
      v-if="props.actionLabel !== ''"
      variant="text"
      class="md-snackbar__action"
      @click="$emit('action')"
    >
      {{ props.actionLabel }}
    </MdButton>
  </div>
</template>

<style scoped>
.md-snackbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-sys-spacing-4);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-3);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  box-shadow: var(--md-sys-elevation-level3);
}

.md-snackbar--error {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.md-snackbar__message {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
}
</style>
