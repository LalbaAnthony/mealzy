<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUiStore } from '../../stores/ui-store';
import MdSnackbar from '../md/MdSnackbar.vue';

const ui = useUiStore();
const { messages } = storeToRefs(ui);
</script>

<template>
  <div class="snackbar-host" role="status" aria-live="polite" aria-atomic="false">
    <MdSnackbar
      v-for="message in messages"
      :key="message.id"
      :message="message.text"
      :tone="message.tone"
      action-label="Dismiss"
      @action="ui.dismiss(message.id)"
    />
  </div>
</template>

<style scoped>
.snackbar-host {
  position: fixed;
  inset-block-end: calc(
    var(--md-sys-size-navigation-bar) + var(--md-sys-spacing-4) + env(safe-area-inset-bottom, 0px)
  );
  inset-inline: var(--md-sys-spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-2);
  align-items: center;
  z-index: var(--md-sys-z-index-snackbar);
  pointer-events: none;
}

.snackbar-host > * {
  pointer-events: auto;
  inline-size: 100%;
  max-inline-size: 30rem;
}

@media (min-width: 840px) {
  .snackbar-host {
    inset-block-end: var(--md-sys-spacing-4);
  }
}
</style>
