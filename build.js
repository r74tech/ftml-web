#!/usr/bin/node
console.time('Bundling time');
const { build } = require('vite');
const { join, dirname } = require('path');
const fs = require('fs');

/** @type 'production' | 'development' | 'test' */
const mode = process.env.MODE || 'production';

const configs = [
  join(process.cwd(), 'vite.config.js'),
  // join(process.cwd(), 'scripts/config.browser.vite.js'),
];

/**
 * Run `vite build` for config file
 * @param {string} configFile
 * @return {Promise<RollupOutput | RollupOutput[]>}
 */
const buildByConfig = (configFile) => build({ configFile, mode });

/**
 * Ensure directory exists
 * @param {string} filePath
 */
const ensureDirExists = (filePath) => {
  const dir = dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

Promise.all(configs.map(buildByConfig))
  .then(() => {
    const distDir = join(process.cwd(), 'dist');

    // Paths for the files to copy
    const workerSrc = join(process.cwd(), 'src/ftml.web.worker.js');
    const workerDest = join(distDir, 'ftml.web.worker.js');

    const wasmSrc = join(process.cwd(), 'src/lib/ftml-wasm/esm/wj-ftml-wasm.esm.js');
    const wasmDest = join(distDir, 'lib/ftml-wasm/esm/wj-ftml-wasm.esm.js');

    // Ensure destination directories exist
    ensureDirExists(workerDest);
    ensureDirExists(wasmDest);

    // Copy the worker file to the dist directory
    fs.copyFileSync(workerSrc, workerDest);

    // Copy the wasm file to the dist directory
    fs.copyFileSync(wasmSrc, wasmDest);

    // Copy index.html to 404.html for GitHub Pages
    fs.copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'));

    console.timeEnd('Bundling time');
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
