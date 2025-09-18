import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm'],
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  minify: false,
});
