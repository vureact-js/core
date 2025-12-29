import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

const banner = `/**
 * vureact/runtime-core v1.0.0
 * (c) 2025-present Owen Dells
 * @license MIT
 **/
`;

const external = [
  'react',
  'react-dom',
  'react-transition-group',
  'react-router-dom',
  'freeze-mutate',
  'immer',
  'klona',
  'react-fast-compare',
  'use-immer',
];

const entries = {
  index: 'src/index.ts',
  'adapter-components': 'src/adapter-components/index.ts',
  'adapter-hooks': 'src/adapter-hooks/index.ts',
  'adapter-utils': 'src/adapter-utils/index.ts',
};

export default [
  {
    input: entries,

    external,

    output: [
      {
        dir: 'lib/cjs',
        format: 'cjs',
        entryFileNames: '[name].cjs', // 保持分包目录结构
        chunkFileNames: 'chunks/[name]-[hash].cjs', // 公共代码提取到 chunks 目录
        sourcemap: true,
        banner,
      },
      {
        dir: 'lib/esm',
        format: 'es',
        entryFileNames: '[name].mjs',
        chunkFileNames: 'chunks/[name]-[hash].mjs',
        sourcemap: true,
        banner,
      },
    ],

    treeshake: {
      preset: 'recommended',
      moduleSideEffects: true,
    },

    plugins: [
      resolve({}),

      commonjs(),

      alias({
        resolve: ['.ts', '.tsx'],
      }),

      typescript({
        tsconfig: './tsconfig-rollup.json',
        declaration: false,
        // declaration: tsconfig.declaration,
        // declarationDir: tsconfig.declarationDir,
        // outDir: tsconfig.outDir,
        // rootDir: tsconfig.rootDir,
      }),

      terser({
        compress: {
          drop_console: false,
          pure_funcs: [
            'console.log',
            'console.warn',
            'console.info',
            'console.debug',
            'console.trace',
          ],
          passes: 2,
          booleans: true,
          conditionals: true,
          dead_code: true,
          unused: true,
          join_vars: true,
          sequences: true,
          reduce_funcs: true,
          comparisons: true,
        },
        format: {
          beautify: false,
          comments: (_, comment) => {
            const text = comment.value;
            return /Owen Dells/i.test(text);
          },
        },
      }),

      visualizer({
        filename: './bundles-size.html',
        open: false,
      }),
    ],
  },

  ...Object.keys(entries).map((name) => ({
    input: entries[name],
    output: {
      file: `lib/${name}.d.ts`,
      format: 'es',
    },
    plugins: [dts()],
    external,
  })),
];
