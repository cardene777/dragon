import { defineConfig } from 'tsup';

// Build after the core so the frame's and the SDK entry's (#3698) self-reference resolves the public types.
// 軽い入口の帯の入口 (#3789) は軽い入口を外の物として読み、既定の入口を束ねも読みもしない。書き出す部品は同じ置き場の隣 (`./capture.js`) から読む
export default defineConfig({
  entry: { frame: 'src/frame/index.ts', header: 'src/frame/header.ts', embed: 'src/embed/index.ts', 'light-frame': 'src/light-frame.ts' },
  format: ['esm','cjs'],
  dts: { resolve: false, compilerOptions: { composite: false } },
  splitting: false,
  sourcemap: true,
  clean: false,
  platform: 'browser',
  external: ['@cardenelabs/dragon','./capture.js'],
  outDir: 'dist',
  target: 'es2022',
});
