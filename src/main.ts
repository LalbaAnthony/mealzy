import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import StorageUnavailableView from './views/StorageUnavailableView.vue';
import { router } from './router';
import { bootstrapApplication } from './app/bootstrap';
import { StorageError } from './infrastructure/persistence/storage-error';
import './styles/tokens.css';
import './styles/base.css';
import './assets/icons/material-symbols-subset.css';

function describeStartupFailure(error: unknown): string {
  if (error instanceof StorageError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error stopped the application from starting.';
}

async function start(): Promise<void> {
  try {
    await bootstrapApplication();
  } catch (error) {
    createApp(StorageUnavailableView, { message: describeStartupFailure(error) }).mount('#app');
    return;
  }

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.mount('#app');
}

void start();
