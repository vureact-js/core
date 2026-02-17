import { generate } from '@babel/generator';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext, ProvideData } from '@compiler/context/types';
import { ADAPTER_COMPS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { recordImport } from '@transform/shared';
import { isCalleeNamed } from '../../shared/babel-utils';

type ArgumentType = t.Expression | t.SpreadElement | t.ArgumentPlaceholder;

/**
 * 将 provide 转换成 AST 描述结构，记录到编译上下文，
 * 在生成阶段根据 AST 生成对应结构的 CtxProvider 适配组件
 */
export function resolveProvide(ctx: ICompilationContext): TraverseOptions {
  if (ctx.inputType !== 'sfc') return {};

  return {
    CallExpression(path) {
      const { node } = path;
      if (!isCalleeNamed(node, 'provide')) return;

      const { provide } = ctx.scriptData;
      const [key, value] = node.arguments;

      const target = findOrCreateCtxProvider(provide);

      assignProviderValue(target, key, value);
      recordImport(ctx, PACKAGE_NAME.runtime, ADAPTER_COMPS.Provider);

      path.parentPath.remove();
    },
  };
}

function findOrCreateCtxProvider(root: ProvideData) {
  if (!root.isOccupied) {
    return root;
  }

  let cur = root.provide;
  while (cur?.isOccupied) {
    cur = cur.provide ?? {};
  }

  return cur || (root.provide = {});
}

function assignProviderValue(
  target: ProvideData['provide'],
  key?: ArgumentType,
  value?: ArgumentType,
) {
  const getRawExp = (exp?: ArgumentType): string => {
    if (!exp) return "''"; // 空字符串

    if (t.isStringLiteral(exp)) {
      return `'${exp.value}'`;
    }

    if (t.isNumericLiteral(exp)) {
      return exp.value.toString();
    }

    if (t.isIdentifier(exp)) {
      return exp.name;
    }

    try {
      // 降级：直接使用源码
      return generate(exp).code;
    } catch {
      return 'null';
    }
  };

  target.isOccupied = true;
  target.name = getRawExp(key);
  target.value = getRawExp(value);
  target.provide = {};
}
