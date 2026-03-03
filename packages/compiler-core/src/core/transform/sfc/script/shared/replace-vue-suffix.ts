import { StringLiteral } from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';

/**
 * 替换 .vue 文件名后缀为 .jsx/.tsx
 *
 * @param node babel 字符串节点
 */
export function replaceVueSuffix(ctx: ICompilationContext, node: StringLiteral) {
  if (!node.value.endsWith('.vue')) return;

  // const { scriptData } = ctx;
  // const jsxFile = node.value.replace(/.vue$/, `.${scriptData.lang}x`);

  const jsxFile = node.value.replace(/.vue$/, ''); // 无需后缀
  node.value = jsxFile;
  node.extra = { rawValue: jsxFile, raw: jsxFile };
}
