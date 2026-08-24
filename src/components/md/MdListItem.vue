<script setup lang="ts">
import type { MdListItemProps } from '../../types/components';

const props = withDefaults(defineProps<MdListItemProps>(), {
  supportingText: '',
  lines: 'one',
  interactive: false,
});
</script>

<template>
  <li class="md-list-item" :class="`md-list-item--${props.lines}`">
    <div v-if="$slots.leading" class="md-list-item__leading">
      <slot name="leading" />
    </div>
    <div class="md-list-item__content">
      <p class="md-list-item__headline">{{ props.headline }}</p>
      <p v-if="props.supportingText !== ''" class="md-list-item__supporting">
        {{ props.supportingText }}
      </p>
      <slot name="details" />
    </div>
    <div v-if="$slots.trailing" class="md-list-item__trailing">
      <slot name="trailing" />
    </div>
  </li>
</template>

<style scoped>
.md-list-item {
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-3);
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-2);
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface);
}

.md-list-item__leading,
.md-list-item__trailing {
  display: flex;
  align-items: center;
  gap: var(--md-sys-spacing-1);
  flex: none;
}

.md-list-item__content {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
  flex: 1 1 auto;
  min-inline-size: 0;
}

.md-list-item__headline {
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
}

.md-list-item__supporting {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
