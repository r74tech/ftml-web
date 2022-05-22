import { PluginOption } from 'vite';
import { vitePluginBw } from './vite/bundled-worker';

export const vitePlugins: PluginOption[] = [
    vitePluginBw()
]