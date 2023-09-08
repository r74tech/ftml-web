import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import bundledWorker from './plugins/vite-plugin-bundled-worker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    bundledWorker(),
  ],
})
