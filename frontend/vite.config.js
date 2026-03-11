import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true, // Keep backend CORS compatibility
  },
  build: {
    outDir: 'build' // Keep output directory same as CRA for backend compatibility
  }
});
