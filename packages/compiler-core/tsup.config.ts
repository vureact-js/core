import { defineConfig } from 'tsup';

const banner = `/**
 * vureact/compiler-core v1.0.0
 * (c) 2025-present Owen Dells
 * @license MIT
 **/
`;

export default defineConfig({
  tsconfig: './tsconfig-build.json',
  // 关键修改：使用对象映射入口，确保输出文件名与 package.json 对应
  entry: {
    index: 'src/index.ts',
    'parse/index': 'src/core/parse/index.ts',
    'transform/index': 'src/core/transform/index.ts',
    'codegen/index': 'src/core/codegen/index.ts',
  },
  banner: {
    js: banner,
  },
  outDir: 'lib',
  format: ['cjs', 'esm'],
  // 自动根据 entry 生成对应的 .d.ts 文件
  dts: true,
  clean: true,
  splitting: true, // 开启代码分割，提取公共逻辑
  minify: true, // 编译器代码建议开启压缩
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
