import devtools from 'solid-devtools/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solid(),
    devtools(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Speednote',
        short_name: 'Speednote',
        icons: [
          {
            src: 'icon-64.png',
            type: 'image/png',
            sizes: '64x64 32x32 24x24 16x16',
          },
          {
            src: 'icon-128.png',
            type: 'image/png',
            sizes: '128x128',
          },
          {
            src: 'icon-256.png',
            type: 'image/png',
            sizes: '256x256',
          },
          {
            src: 'icon-512.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
        theme_color: '#e67e22',
        background_color: '#f1c40f',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        description: 'Speednote, the fastest way to put your quick thoughts!',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    target: 'esnext',
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*'],
    coverage: {
      include: ['src/**'],
      exclude: ['src/index.tsx'], // Main function do not need testing.
    },
  },
});
