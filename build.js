#!/usr/bin/node
console.time('Bundling time');
import { build } from 'vite';
import { join } from 'path';
import fs from 'fs';

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

Promise.all(configs.map(buildByConfig))
    .then(() => {
        const distDir = join(process.cwd(), 'dist');
        fs.copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'));
        console.timeEnd('Bundling time');
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });