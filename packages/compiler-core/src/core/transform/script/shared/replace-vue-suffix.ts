import { StringLiteral } from '@babel/types';
import { compileContext } from '@src/shared/compile-context';

/**
 * 替换 .vue 文件名后缀为 .jsx/.tsx
 *
 * @param node babel 字符串节点
 */
export function replaceVueSuffix(node: StringLiteral) {
  if (!node.value.endsWith('.vue')) return;

  const { lang } = compileContext.context;
  const jsxFile = `"${node.value.replace(/.vue$/, `.${lang.script}x`)}"`;

  node.value = jsxFile;
  node.extra = { rawValue: jsxFile, raw: jsxFile };
}
