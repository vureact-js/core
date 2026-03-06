import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
import { MACRO_API_NAMES } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { logger } from '@shared/logger';
import { recordImport } from '@transform/shared';
import { isCalleeNamed } from '../../shared/babel-utils';
import { createUseImperativeHandle } from '../../shared/hook-creator';

/**
 * 处理 defineExpose 宏。
 */
export function resolveDefineExpose(ctx: ICompilationContext): TraverseOptions {
  if (ctx.inputType !== 'sfc') return {};

  return {
    CallExpression(path) {
      const { node } = path;
      const { filename, scriptData } = ctx;

      if (!isCalleeNamed(node, MACRO_API_NAMES.expose)) {
        return;
      }

      const [expose] = node.arguments;

      if (!expose) {
        path.remove();
        return;
      }

      const adapter = ADAPTER_RULES.react[MACRO_API_NAMES.expose]!;

      recordImport(ctx, adapter.package, REACT_API_MAP.forwardRef);
      recordImport(ctx, adapter.package, adapter.target);

      // 如果传递的参数不是确定的对象写法或函数，则警告有风险
      if (!t.isObjectExpression(expose) && !t.isFunction(expose)) {
        logger.warn('Non-deterministic object literal may cause unknown risks.', {
          file: filename,
          loc: expose.loc,
          source: scriptData.source,
        });
      }

      // 如果值不是函数，则创建一个箭头函数并返回它
      const init = !t.isFunction(expose)
        ? t.arrowFunctionExpression([], expose as t.Expression)
        : expose;

      // useImperativeHandle 不添加依赖项
      // 1. 保持与 Vue 行为一致：Vue 的 defineExpose 是响应式的，父组件总是能访问最新值
      // 2. 性能影响小：useImperativeHandle 创建的对象很小，重新创建成本低

      const { forwardRef } = scriptData;
      const newNode = createUseImperativeHandle(t.identifier(forwardRef.refField), init);

      forwardRef.enabled = true;
      path.replaceWith(newNode);
    },
  };
}
