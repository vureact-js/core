import { StringLiteral } from '@babel/types';

/**
 * 替换 .vue 文件名后缀为 .jsx/.tsx
 *
 * @param node babel 字符串节点
 */
export function replaceVueSuffix(node: StringLiteral) {
  if (!node.value.endsWith('.vue')) return;

  // 导入 jsx/tsx 文件无需后缀名
  const replaced = node.value.replace(/.vue$/, '');

  node.value = replaced;
  node.extra = {
    rawValue: replaced,
    // fix: 当 minified: true 的情况下，输出内容丢失引号
    raw: `'${replaced}'`,
  };
}
