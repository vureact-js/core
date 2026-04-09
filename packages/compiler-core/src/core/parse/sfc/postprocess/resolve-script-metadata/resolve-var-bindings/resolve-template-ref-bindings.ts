import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { HTML_TAG_TYPES } from '@consts/html-tag-types';
import { VUE_API_MAP } from '@consts/vue-api-map';

/**
 * 收集模板 dom ref 的变量绑定元数据
 */
export function resolveTemplateRefBindings(node: t.VariableDeclarator, ctx: ICompilationContext) {
  const { refBindings } = ctx.templateData;

  const init = node.init! as t.CallExpression;
  const callee = init.callee as t.Identifier;

  if (callee.name !== VUE_API_MAP.useTemplateRef) {
    return;
  }

  const varName = (node.id as t.Identifier).name;

  // 由于 Vue useTemplateRef 接收的值限定只能是字符串字面量，因此可以放心断言
  const initValue = (init.arguments[0] as t.StringLiteral)?.value;

  refBindings.domRefs[varName] = {
    tag: initValue,
    name: varName,
    htmlType: HTML_TAG_TYPES[initValue] || 'HTMLElement',
  };
}
