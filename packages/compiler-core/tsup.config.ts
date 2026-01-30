import fs from 'fs';
import { defineConfig } from 'tsup';

const licenseBanner = `/**
 * @vureact/compiler-core v1.0.0
 * (c) 2025-present Ruihong Zhong (Ryan John)
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
  ],

  banner: {
    js: licenseBanner,
  },

  onSuccess: async () => {
    const cliFiles = ['lib/cli.mjs', 'lib/cli.cjs'];

    cliFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        // 检查是否已经有了 Shebang，如果没有则添加
        if (!content.startsWith('#!')) {
          const newContent = `#!/usr/bin/env node\n${content}`;
          fs.writeFileSync(file, newContent);
        }
      }
    });
  },

  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
});
