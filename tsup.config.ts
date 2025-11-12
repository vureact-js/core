import { defineConfig } from 'tsup';

const banner = `/**
 * vureact v1.0.0
 * (c) 2025-present Owen Dells
 * @license MIT
 **/
`;

export default defineConfig({
  entry: ['src/index.ts', 'src/parse/index.ts', 'src/transform/index.ts', 'src/generate/index.ts'],
  banner: {
    js: banner,
  },
  outDir: 'lib',
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    '@babel/generator',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@vue/compiler-core',
    '@vue/compiler-sfc',
    'colorette',
  ],
  sourcemap: true,
});
