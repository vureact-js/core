import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { logger } from '@shared/logger';
import { isCalleeNamed, replaceCallName } from '../../shared/babel-utils';

export function resolveDefineModel(ctx: ICompilationContext): TraverseOptions {
  if (ctx.inputType !== 'sfc') return {};

  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, MACRO_API_NAMES.model)) {
        return;
      }

      // 验证参数选项 & 变量接收形式
      if (!validateDefineModelUsage(path, ctx)) {
        return;
      }

      // TODO

      // 提取 prop name、类型、默认值
      // 在 script 底部插入 useEffect + props.onUpdateXxx

      // 将 defineModel 替换为 ref 方便后续处理成 useVRef
      replaceCallName(node, VUE_API_MAP.ref);
    },
  };
}

function validateDefineModelUsage(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
): boolean {
  const { node, parent } = path;
  const { filename, scriptData } = ctx;
  const [arg1, arg2] = node.arguments;

  // 检查是否存在 get/set/validator 选项（不支持）
  const hasUnsupportedOption = (arg: any): boolean => {
    if (!t.isObjectExpression(arg)) {
      return false;
    }

    const result = arg.properties.some((prop) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const keyName = prop.key.name;

        if (keyName === 'get' || keyName === 'set' || keyName === 'validator') {
          logger.error(`defineModel does not support '${keyName}' option.`, {
            file: filename,
            source: scriptData.source,
            loc: prop.key.loc,
          });

          return true;
        }
      }
    });

    return !!result;
  };

  // 检查变量接收形式是否为数组解构（不支持）
  const isValidVariableAssignment = (): boolean => {
    if (
      t.isVariableDeclaration(parent) &&
      parent.declarations.length === 1 &&
      t.isArrayPattern(parent.declarations[0]?.id)
    ) {
      logger.error(
        `defineModel return value cannot be destructured with array pattern. Please use single variable assignment.`,
        {
          file: filename,
          source: scriptData.source,
          loc: parent.loc,
        },
      );

      return false;
    }

    return true;
  };

  return !hasUnsupportedOption(arg1) && !hasUnsupportedOption(arg2) && isValidVariableAssignment();
}
