import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',  // ← THIS FIXES PATHS
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});