<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NAVIGATION_ITEMS } from './router/navigation';
import { useTheme } from './composables/useTheme';
import { useViewport } from './composables/useViewport';
import { useSettingsStore } from './stores/settings-store';
import MdIconButton from './components/md/MdIconButton.vue';
import MdNavigationBar from './components/md/MdNavigationBar.vue';
import MdTopAppBar from './components/md/MdTopAppBar.vue';
import PwaUpdatePrompt from './components/app/PwaUpdatePrompt.vue';
import SnackbarHost from './components/app/SnackbarHost.vue';

const route = useRoute();
const router = useRouter();
const settings = useSettingsStore();
const { viewportClass } = useViewport();

useTheme();

const isExpanded = computed(() => viewportClass.value === 'expanded');
const title = computed(() => route.meta.title);

async function openSettings(): Promise<void> {
  await router.push('/settings');
}

onMounted(async () => {
  await settings.load();
});
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--expanded': isExpanded }">
    <MdNavigationBar v-if="isExpanded" :items="NAVIGATION_ITEMS" rail />
    <div class="app-shell__body">
      <MdTopAppBar :title="title">
        <template #actions>
          <MdIconButton icon="settings" label="Settings" @click="openSettings" />
        </template>
      </MdTopAppBar>
      <main class="app-shell__content">
        <RouterView />
      </main>
      <MdNavigationBar v-if="!isExpanded" :items="NAVIGATION_ITEMS" />
    </div>
    <SnackbarHost />
    <PwaUpdatePrompt />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  overflow: hidden;
  background-color: var(--md-sys-color-background);
}

.app-shell--expanded {
  flex-direction: row;
}

.app-shell__body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-inline-size: 0;
  min-block-size: 0;
}

.app-shell__content {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  inline-size: 100%;
  max-inline-size: var(--md-sys-size-content-max-width);
  margin-inline: auto;
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-4);
}
</style>
