import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import pkg from './package.json';

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

export default [
  {
    input: 'src/index.ts',

    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        banner,
      },
      {
        file: pkg.module,
        format: 'es',
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
    external,
  },

  {
    input: 'src/index.ts',
    output: {
      file: pkg.types,
      format: 'es',
    },
    plugins: [
      dts(),
    ],
    external,
  },
];
