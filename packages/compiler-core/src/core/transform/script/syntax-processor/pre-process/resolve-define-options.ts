import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { isCalleeNamed } from '../../shared/babel-utils';

/**
 * 处理 defineOptions API，暂时只用于获取组件名
 */
export function resolvesDefineOptions(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, 'defineOptions')) {
        path.skip();
        return;
      }

      const [arg] = node.arguments;

      if (!t.isObjectExpression(arg)) {
        logger.error('Argument for defineOptions must be an object expression.', {
          source: ctx.source,
          file: ctx.filename,
          loc: arg!.loc!,
        });
      } else {
        let name = '';

        // 遍历组件选项，获取 name
        for (const prop of arg.properties) {
          if (
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key) &&
            !prop.computed &&
            prop.key.name === 'name'
          ) {
            // 只允许 name 的值是字符串，避免过度解析
            if (t.isStringLiteral(prop.value)) {
              name = prop.value.value;
              break;
            }

            logger.error(`name must be a string type, but got ${prop.value.type}`, {
              source: ctx.source,
              file: ctx.filename,
              loc: prop.key!.loc!,
            });

            break;
          }
        }

        // 组件名保存到编译上下文
        ctx.funcName = name;
      }

      path.remove();
    },
  };
}
