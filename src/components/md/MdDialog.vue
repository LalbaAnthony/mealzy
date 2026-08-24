<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue';
import type { MdDialogProps } from '../../types/components';

const props = defineProps<MdDialogProps>();

const emit = defineEmits<{ close: [] }>();

const surface = ref<HTMLElement | null>(null);
const titleId = useId();
let previouslyFocused: HTMLElement | null = null;

const FOCUSABLE_SELECTOR =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function focusableElements(): HTMLElement[] {
  const container = surface.value;
  if (container === null) {
    return [];
  }
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
    return;
  }
  if (event.key !== 'Tab') {
    return;
  }

  const elements = focusableElements();
  const first = elements[0];
  const last = elements[elements.length - 1];
  if (first === undefined || last === undefined) {
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      const elements = focusableElements();
      const target = elements[0] ?? surface.value;
      target?.focus();
      return;
    }
    previouslyFocused?.focus();
    previouslyFocused = null;
  },
);
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="md-dialog__scrim" @click.self="emit('close')">
      <div
        ref="surface"
        class="md-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="props.describedBy"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <h2 :id="titleId" class="md-dialog__title">{{ props.title }}</h2>
        <div class="md-dialog__content">
          <slot />
        </div>
        <div class="md-dialog__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.md-dialog__scrim {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md-sys-spacing-4);
  background-color: color-mix(in srgb, var(--md-sys-color-scrim) 40%, transparent);
  z-index: var(--md-sys-z-index-dialog);
}

.md-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  inline-size: 100%;
  max-inline-size: 26rem;
  max-block-size: 90vh;
  overflow-y: auto;
  padding: var(--md-sys-spacing-6);
  border-radius: var(--md-sys-shape-corner-extra-large);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  box-shadow: var(--md-sys-elevation-level3);
}

.md-dialog__title {
  font-size: var(--md-sys-typescale-headline-small-size);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  font-weight: var(--md-sys-typescale-weight-regular);
}

.md-dialog__content {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-3);
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--md-sys-spacing-2);
  flex-wrap: wrap;
}
</style>
