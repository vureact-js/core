import { traverse } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { HTML_TAG_TYPES } from '@consts/html-tag-types';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { atComponentOrHookRoot } from '@shared/babel-utils';
import { getReactiveStateApis, getReactiveType } from '@shared/reactive-utils';
import { ParseResult } from '..';

/**
 * 使用 Babel 预分析 script，只做简单的元数据收集，供模板转换时使用。
 */
export function resolveScriptMeta(result: ParseResult, ctx: ICompilationContext) {
  const scriptAST = result.script?.ast;
  if (!scriptAST) return;

  traverse(scriptAST, {
    VariableDeclarator(path) {
      const { node } = path;

      if (!atComponentOrHookRoot(path, scriptAST.program) || !t.isIdentifier(node.id)) {
        return;
      }

      // 针对初始值为函数调用的
      if (node.init && t.isCallExpression(node.init) && t.isIdentifier(node.init.callee)) {
        collectReactiveBindings(node, ctx);
        collectRefBindings(node, ctx);
      }
    },
  });
}

function collectReactiveBindings(node: t.VariableDeclarator, ctx: ICompilationContext) {
  const { reactiveBindings } = ctx.templateData;
  const reactiveStateApis = getReactiveStateApis();

  const init = node.init! as t.CallExpression;
  const callee = init.callee as t.Identifier;

  // 不是响应式API调用，直接返回
  if (!reactiveStateApis.has(callee.name)) return;

  const idName = (node.id as t.Identifier).name;
  const value = init.arguments[0]! as t.Expression;

  reactiveBindings[idName] = {
    name: idName,
    value,
    reactiveType: getReactiveType(callee.name),
  };
}

function collectRefBindings(node: t.VariableDeclarator, ctx: ICompilationContext) {
  const { refBindings } = ctx.templateData;

  const init = node.init! as t.CallExpression;
  const callee = init.callee as t.Identifier;

  if (callee.name !== VUE_API_MAP.useTemplateRef) return;

  const idName = (node.id as t.Identifier).name;

  // 由于 Vue useTemplateRef 接收的值限定只能是字符串字面量，因此可以放心断言
  const tag = (init.arguments[0] as t.StringLiteral)?.value;

  refBindings[idName] = {
    tag,
    htmlType: HTML_TAG_TYPES[tag] || 'HTMLElement',
    name: idName,
  };
}
