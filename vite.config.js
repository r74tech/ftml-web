const { resolve, join } = require('path');
const bundledWorker = require(resolve(__dirname, './plugins/vite-plugin-bundled-worker'));
const crossPlatform = require(resolve(__dirname, './plugins/vite-plugin-cross-platform'));
/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
module.exports = {
  mode: process.env.MODE,
  base: './',
  root: join(process.cwd(), './src'),
  publicDir: "./files--static",
  server: {
    port: 1212,
    fs: {
      strict: false,
      allow: ['./'],
    },
  },
  plugins: [
    bundledWorker(),
    crossPlatform("node"),
  ],
  build: {
    target: 'es2020',
    polyfillDynamicImport: false,
    minify: process.env.MODE === 'development' ? false : 'terser',
    base: '',
    outDir: join(process.cwd(), 'dist'),
    assetsDir: '.',
    emptyOutDir: true,
    sourcemap: true,
  },
};