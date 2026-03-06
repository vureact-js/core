import { generate } from '@babel/generator';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext, ProvideData } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { recordImport } from '@transform/shared';
import { isCalleeNamed } from '../../shared/babel-utils';

type ArgumentType = t.Expression | t.SpreadElement | t.ArgumentPlaceholder;

/**
 * 将 provide 转换成 AST 描述结构，记录到编译上下文，
 * 在生成阶段根据 AST 生成对应结构的 CtxProvider 适配组件
 */
export function resolveProvide(ctx: ICompilationContext): TraverseOptions {
  // 仅处理 SFC 文件
  if (ctx.inputType !== 'sfc') return {};

  return {
    CallExpression(path) {
      const { node } = path;

      // 检查是否为 provide 调用
      if (!isCalleeNamed(node, VUE_API_MAP.provide)) return;

      // 获取编译上下文中的 provide 数据
      const { provide } = ctx.scriptData;

      // 提取 provide 的参数：key 和 value
      const [key, value] = node.arguments;

      // 查找或创建 CtxProvider 目标节点
      const target = findOrCreateCtxProvider(provide);

      // 获取 provide 对应的适配器规则
      const adapter = ADAPTER_RULES.runtime[VUE_API_MAP.provide]!;

      // 为目标节点赋值
      assignProviderValue(target, key, value);

      // 记录适配器所需的导入
      recordImport(ctx, adapter.package, adapter.target);

      // 移除原始 provide 调用节点
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
