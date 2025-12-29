import { defineConfig } from 'tsup';

const banner = `/**
 * @vureact/compiler-core v1.0.0
 * (c) 2025-present Ryan John
 * @license MIT
 */
`;

export default defineConfig({
  tsconfig: './tsconfig-build.json',
  entry: {
    'compiler-core': 'src/index.ts',
  },
  banner: {
    js: banner,
  },
  outDir: 'lib',
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  minify: false,
  external: [
    '@babel/generator',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@babel/core',
    '@vue/compiler-core',
    '@vue/compiler-sfc',
    'kleur',
  ],
  sourcemap: true,
  // 确保生成文件的扩展名与 package.json 中的 .mjs / .cjs 一致
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
});
