<script setup lang="ts">
import type { MdSnackbarProps } from '../../types/components';
import MdButton from './MdButton.vue';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdSnackbarProps>(), {
  tone: 'neutral',
  actionLabel: '',
});

defineEmits<{ action: [] }>();
</script>

<template>
  <div class="md-snackbar" :class="`md-snackbar--${props.tone}`">
    <MdIcon v-if="props.tone === 'error'" name="error" class="md-snackbar__icon" />
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
  gap: var(--md-sys-spacing-4);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-3);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  box-shadow: var(--md-sys-elevation-level3);
}

.md-snackbar__icon {
  flex: none;
}

.md-snackbar--error .md-snackbar__icon {
  color: var(--md-sys-color-error-container);
}

.md-snackbar__message {
  flex: 1 1 auto;
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
}

.md-snackbar .md-snackbar__action {
  flex: none;
  color: var(--md-sys-color-inverse-primary);
}
</style>
