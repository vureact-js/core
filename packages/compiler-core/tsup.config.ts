import { defineConfig } from 'tsup';
import { author, version } from './package.json';

const licenseBanner = `/**
 * @vureact/compiler-core v${version}
 * (c) 2025-present ${author}
 * @license MIT
 */
`;

export default defineConfig({
  tsconfig: './tsconfig-build.json',
  entry: {
    'compiler-core': 'src/index.ts',
    cli: 'src/cli/index.ts',
  },
  outDir: 'lib',
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  minify: false,
  sourcemap: false,
  external: [
    '@babel/generator',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@babel/core',
    '@vue/compiler-core',
    '@vue/compiler-sfc',
    'kleur',
    'prettier',
    'minimatch',
    'xxhashjs',
    'postcss',
    'cac',
    'ora',
    'chokidar',
    'less',
    'sass',
    'update-notifier',
    'proper-lockfile',
  ],

  banner: {
    js: licenseBanner,
  },

  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.esm.js' : '.js',
    };
  },
});
