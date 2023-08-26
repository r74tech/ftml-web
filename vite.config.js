const { resolve, join } = require('path');
const mergeQueries = require("postcss-merge-queries")
const autoprefixer = require("autoprefixer")
const bundledWorker = require(resolve(__dirname, './plugins/vite-plugin-bundled-worker'));
const crossPlatform = require(resolve(__dirname, './plugins/vite-plugin-cross-platform'));
import path from 'path'
/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const root = join(process.cwd(), './src');
module.exports = {
  mode: process.env.MODE,
  base: '/',
  root: root,
  publicDir: "./public",
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
    base: '/',
    outDir: join(process.cwd(), 'dist'),
    rollupOptions: {
      input: {
        main: resolve(__dirname, root, 'index.html'),
      },
      external: [
        /^virtual:.*/,
      ]
    },
    assetsDir: '.',
    emptyOutDir: true,
    sourcemap: true,
  },
  css: {
    postcss: {
      plugins: [autoprefixer(), mergeQueries({ sort: true })]
    },
    preprocessorOptions: {
      scss: { sourceMap: true }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, root),
      '/node_modules/': path.resolve(__dirname, 'node_modules/'),
      "@wikijump": resolve(__dirname, 'modules/'),
    },
  },
};