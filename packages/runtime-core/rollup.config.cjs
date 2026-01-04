import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

const banner = `/**
 * @vureact/runtime-core v1.0.0
 * (c) 2025-present Ryan John
 * @license MIT
 */
`;

const entries = {
  'runtime-core': 'src/index.ts',
  'adapter-components': 'src/adapter-components/index.ts',
  'adapter-hooks': 'src/adapter-hooks/index.ts',
  'adapter-router': 'src/adapter-router/index.ts',
  'adapter-utils': 'src/adapter-utils/index.ts',
};

const manualChunks = (id) => {
  // 根据源模块路径来正确命名 chunk，避免模块名导致的误会
  if (id.includes('adapter-components')) return 'adapter-components-shared';
  if (id.includes('adapter-hooks')) return 'adapter-hooks-shared';
  if (id.includes('adapter-router')) return 'adapter-router-shared';
  if (id.includes('adapter-utils')) return 'adapter-utils-shared';
};

const outputItem = (type = 'cjs', format = 'cjs') => ({
  dir: `lib/${type}`,
  format,
  entryFileNames: `[name].${type}`, // 保持分包目录结构
  chunkFileNames: `chunks/[name]-[hash].${type}`, // 公共代码提取到 chunks 目录
  sourcemap: true,
  banner,
  manualChunks,
});

const externalPkgs = [
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

const external = (id) => externalPkgs.some((pkg) => id === pkg || id.startsWith(pkg + '/'));

export default [
  {
    input: entries,

    output: [outputItem('cjs'), outputItem('mjs', 'es')],

    external,

    treeshake: {
      preset: 'recommended',
      moduleSideEffects: true,
    },

    plugins: [
      resolve({}),

      commonjs(),

      alias({
        entries: {
          '@src': './src',
        },
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
            return /@vureact\/runtime-core/i.test(text);
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
      file: `lib/types/${name}.d.ts`,
      format: 'es',
    },
    plugins: [dts()],
    external,
  })),
];
