import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

function requireEnv(env: Record<string, string>, key: string): string {
  const value = env[key];
  if (value === undefined || value.length === 0) {
    throw new Error(
      `Missing required environment variable ${key}. Copy .env.example to .env and fill every value.`,
    );
  }
  return value;
}

const themeColor = '#8f4c38';
const backgroundColor = '#fff8f6';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2023',
      sourcemap: mode !== 'production',
      cssCodeSplit: false,
    },
    plugins: [
      vue(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        strategies: 'generateSW',
        includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
        manifest: {
          name: requireEnv(env, 'VITE_APP_NAME'),
          short_name: requireEnv(env, 'VITE_APP_SHORT_NAME'),
          description: requireEnv(env, 'VITE_APP_DESCRIPTION'),
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: themeColor,
          background_color: backgroundColor,
          categories: ['food', 'lifestyle', 'productivity'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          skipWaiting: false,
          runtimeCaching: [],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
