import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { isCalleeNamed } from '../../shared/babel-utils';

/**
 * 处理 defineOptions
 */
export function resolveOptions(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, 'defineOptions')) {
        path.skip();
        return;
      }

      const [options] = node.arguments;
      const { filename, scriptData } = ctx;

      if (!options) {
        logger.warn('defineOptions was found, but no options were provided.', {
          source: scriptData.source,
          file: filename,
          loc: node?.loc,
        });
        path.remove();
        return;
      }

      if (!t.isObjectExpression(options)) {
        logger.warn('Argument for defineOptions must be an object expression.', {
          source: scriptData.source,
          file: filename,
          loc: options?.loc,
        });
      } else {
        for (const prop of options.properties) {
          if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) {
            continue;
          }

          extractName(prop, ctx);
        }
      }

      path.remove();
    },
  };
}

function extractName(prop: t.ObjectProperty, ctx: ICompilationContext) {
  if (ctx.compName) return;

  const { filename, scriptData } = ctx;

  // 查找 name 选项
  if (!prop.computed && (prop.key as any).name === 'name') {
    // 只允许 name 的值是字符串，避免过度解析
    if (t.isStringLiteral(prop.value)) {
      ctx.compName = prop.value.value;
      return;
    }

    logger.error(`name must be a string type, but got ${prop.value.type}`, {
      source: scriptData.source,
      file: filename,
      loc: prop.key?.loc,
    });
  }
}
