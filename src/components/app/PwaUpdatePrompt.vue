<script setup lang="ts">
import { usePwaUpdate } from '../../composables/usePwaUpdate';
import MdButton from '../md/MdButton.vue';

const { needRefresh, offlineReady, applyUpdate, dismissUpdate, dismissOfflineReady } =
  usePwaUpdate();
</script>

<template>
  <div v-if="needRefresh || offlineReady" class="pwa-prompt" role="status" aria-live="polite">
    <template v-if="needRefresh">
      <p class="pwa-prompt__message">A new version is ready.</p>
      <div class="pwa-prompt__actions">
        <MdButton variant="text" @click="dismissUpdate">Later</MdButton>
        <MdButton variant="tonal" @click="applyUpdate">Reload</MdButton>
      </div>
    </template>
    <template v-else>
      <p class="pwa-prompt__message">Ready to work offline.</p>
      <div class="pwa-prompt__actions">
        <MdButton variant="text" @click="dismissOfflineReady">Dismiss</MdButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pwa-prompt {
  position: fixed;
  inset-block-start: var(--md-sys-spacing-4);
  inset-inline: var(--md-sys-spacing-4);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-sys-spacing-3);
  max-inline-size: 30rem;
  margin-inline: auto;
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-3);
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  box-shadow: var(--md-sys-elevation-level3);
  z-index: var(--md-sys-z-index-snackbar);
}

.pwa-prompt__message {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
}

.pwa-prompt__actions {
  display: flex;
  gap: var(--md-sys-spacing-2);
}
</style>
