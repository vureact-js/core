import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { logger } from '@shared/logger';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { replaceNode } from '../../shared/babel-utils';

/**
 * 转换 defineEmits 的返回值调用形式，
 * 如 emit('click', e) => props.onClick?.(e)
 * 如 emit(eventName, e) => props[eventName]?.(e)
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

      let propCall: t.OptionalCallExpression;

      if (t.isStringLiteral(callee)) {
        // 字符串事件名：格式化为 onEventName 后通过静态属性访问
        const eventName = formatEmitEventName(callee.value);
        propCall = createPropCall(ctx.propField, t.identifier(eventName), args);
      } else {
        // re：非字符串事件名：使用计算属性访问，如 props[eventName]?.()
        propCall = createPropCall(ctx.propField, callee, args, true);

        // re：由于无法格式化为 React 风格的 onXxx 属性名，emit 调用可能无效
        logger.error(
          `Non-string event name cannot be converted to React onXxx style. The emit call will not work as expected.`,
          {
            file: filename,
            source: scriptData.source,
            loc: callee?.loc,
          },
        );
      }

      replaceNode(path, propCall, node);
    },
  };
}

function createPropCall(rootName: string, callee: any, args: any, computed = false) {
  return t.optionalCallExpression(
    t.memberExpression(t.identifier(rootName), callee as t.Expression, computed),
    args,
    true,
  );
}
