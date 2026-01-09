import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { checkIsCallExpInAnyCallback } from './babel-utils';
import { CallExpArgs } from './types';

/**
 * 用于警告使用了不受支持的 Vue hook 回调参数或选项
 */
export function warnVueHookArguments(ctx: ICompilationContext, args: CallExpArgs) {
  const [callExp, opt] = args;
  const { source, filename } = ctx;

  if (t.isFunction(callExp) && callExp.params.length) {
    logger.warn('Unsupported Vue hook params may result in reference errors.', {
      source,
      file: filename,
      loc: callExp.params[0]!.loc!,
    });
  }

  if (opt) {
    logger.warn('Ignored unsupported Vue hook options.', {
      source,
      file: filename,
      loc: opt!.loc!,
    });
    args.length = 1;
  }
}

/**
 * 检查 Vue hook 是否在块语句中（如 if、for、while 等）
 */
export function warnVueHookInBlock(ctx: ICompilationContext, path: NodePath) {
  const { source, filename } = ctx;
  const inBlock = path.findParent((p) => t.isBlockStatement(p.node) && !t.isFunction(p.parent));

  if (inBlock) {
    logger.error(
      'Hook cannot be used inside conditional statements, loops, switch cases, or try-catch blocks.',
      {
        source,
        file: filename,
        loc: path.node.loc!,
      },
    );
  }
}

/**
 * 检查 Vue hook 是否嵌套在任意回调中使用
 */
export function warnVueHookInAnyCallback(
  ctx: ICompilationContext,
  path: NodePath<t.CallExpression>,
) {
  const { source, filename } = ctx;
  // 检查当前 hook 是否在任何回调函数中
  const isInCallback = checkIsCallExpInAnyCallback(path);

  if (isInCallback) {
    logger.error('Hook cannot be used inside any callback function.', {
      source,
      file: filename,
      loc: path.node.loc!,
    });
  }
}

export function warnVueHookWithoutDeclaration(ctx: ICompilationContext, loc: any) {
  const { source, filename } = ctx;
  logger.warn('Calling hooks directly without variable declaration is not supported.', {
    source,
    file: filename,
    loc,
  });
}
