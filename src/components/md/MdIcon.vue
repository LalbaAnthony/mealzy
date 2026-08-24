<script setup lang="ts">
import type { MdIconProps } from '../../types/components';

const props = defineProps<MdIconProps>();
</script>

<template>
  <span class="md-icon" :class="`md-icon--${props.name}`" aria-hidden="true" />
</template>

<style scoped>
.md-icon {
  color: inherit;
}
</style>
