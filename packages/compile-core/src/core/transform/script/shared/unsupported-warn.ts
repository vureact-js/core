import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { compileContext } from '@shared/compile-context';
import { logger } from '@shared/logger';
import { CallExpArgs } from './types';

/**
 * 用于警告使用了不受支持的 Vue hook 回调参数或选项
 */
export function warnVueHookArguments(args: CallExpArgs) {
  const [callExp, opt] = args;
  const { source, filename } = compileContext.context;

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
export function warnVueHookInBlock(path: NodePath) {
  const { source, filename } = compileContext.context;
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
