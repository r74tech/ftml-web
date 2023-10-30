import mergeQueries from "postcss-merge-queries"
import autoprefixer from "autoprefixer"
import bundledWorker from './plugins/vite-plugin-bundled-worker';
import crossPlatform from './plugins/vite-plugin-cross-platform';
import path, { resolve, join } from 'path'
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
    hmr: false,
  },
  plugins: [
    bundledWorker(),
    crossPlatform("node"),
    // tsconfigPaths(),
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
      "@src": resolve(__dirname, `./src`),
      '/node_modules/': path.resolve(__dirname, 'node_modules/'),
      "@wikijump": resolve(__dirname, 'modules/'),
    },
  },
};