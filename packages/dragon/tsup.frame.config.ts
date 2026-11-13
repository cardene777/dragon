import { defineConfig } from 'tsup';

// Build after the core so the frame's self-reference resolves the public types.
export default defineConfig({
  entry: { frame: 'src/frame/index.ts' },
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
