import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { logger } from '@shared/logger';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';

/**
 * 转换 defineEmits 的返回值调用形式，
 * 如 emit('click', e) => props?.onClick(e)
 */
export function resolveEmitCalls(ctx: ICompilationContext): TraverseOptions {
  // fix: 事件名格式化：支持 update:xxx -> onUpdateXxx，并避免生成包含冒号的非法属性名
  const formatEmitEventName = (raw: string): string => {
    if (raw.startsWith('update:')) {
      const modelKey = raw.slice('update:'.length);
      return `onUpdate${capitalize(camelCase(modelKey))}`;
    }

    const normalized = raw.includes(':') ? raw.replace(/:/g, '-') : raw;
    return `on${capitalize(camelCase(normalized))}`;
  };

  return {
    CallExpression(path) {
      const { node } = path;
      const { filename, templateData, scriptData } = ctx;

      if (!t.isIdentifier(node.callee)) return;

      const { name } = node.callee;

      const checkIfFromDefineEmits = (): boolean => {
        let result = false;

        // 尝试从模板的响应式绑定元数据中查找
        const meta = templateData.reactiveBindings[name];
        if (meta) {
          result = meta.source === MACRO_API_NAMES.emits;
        }

        // 尝试从自身的绑定源节点查找
        if (!result) {
          const binding = path.scope.getBinding(name);
          if (binding) {
            const parent = binding.path.node;
            if (
              t.isVariableDeclarator(parent) &&
              t.isCallExpression(parent.init) &&
              t.isIdentifier(parent.init.callee)
            ) {
              result = parent.init.callee.name === MACRO_API_NAMES.emits;
            }
          }
        }

        return result;
      };

      if (!checkIfFromDefineEmits()) return;

      const [callee, ...args] = node.arguments;

      const eventName = t.isStringLiteral(callee) ? formatEmitEventName(callee.value) : undefined;

      if (!eventName) {
        logger.warn(`Expected String type but got ${callee?.type}, expression will be removed`, {
          file: filename,
          source: scriptData.source,
          loc: callee?.loc,
        });
        path.remove();
        return;
      }

      // 创建相应的 props 调用表达式
      // fix: 函数调用统一修改为可选的
      const propCall = t.optionalCallExpression(
        t.optionalMemberExpression(
          t.identifier(ctx.propField),
          t.identifier(eventName),
          false,
          true,
        ),
        args,
        true,
      );

      path.replaceWith(propCall);
    },
  };
}
