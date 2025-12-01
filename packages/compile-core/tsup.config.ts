import { defineConfig } from 'tsup';

const banner = `/**
 * vureact v1.0.0
 * (c) 2025-present Owen Dells
 * @license MIT
 **/
`;

export default defineConfig({
  tsconfig: './tsconfig-build.json',
  entry: [
    'src/index.ts',
    'src/core/parse/index.ts',
    'src/core/transform/index.ts',
    'src/core/generate/index.ts',
  ],
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
  ],
  sourcemap: true,
});
