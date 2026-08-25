<script setup lang="ts">
import type { MdFabProps } from '../../types/components';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdFabProps>(), { extended: false });

defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
  <button
    class="md-fab"
    :class="{ 'md-fab--extended': props.extended }"
    type="button"
    :aria-label="props.label"
    @click="$emit('click', $event)"
  >
    <MdIcon :name="props.icon" />
    <span v-if="props.extended" class="md-fab__label">{{ props.label }}</span>
  </button>
</template>

<style scoped>
.md-fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md-sys-spacing-2);
  min-inline-size: var(--md-sys-size-fab);
  min-block-size: var(--md-sys-size-fab);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-4);
  border: none;
  border-radius: var(--md-sys-shape-corner-large);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  box-shadow: var(--md-sys-elevation-level3);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  font-weight: var(--md-sys-typescale-weight-medium);
  cursor: pointer;
}

.md-fab--extended {
  padding-inline: var(--md-sys-spacing-5);
}

.md-fab:hover {
  box-shadow: var(--md-sys-elevation-level4);
}
</style>
