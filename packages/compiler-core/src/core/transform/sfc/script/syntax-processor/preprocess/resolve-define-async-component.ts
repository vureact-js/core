import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { logger } from '@shared/logger';
import { isCalleeNamed } from '../../shared/babel-utils';

/**
 * 对 defineAsyncComponent 中不支持的选项进行告警
 */
export function resolveDefineAsyncComponent(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, VUE_API_MAP.defineAsyncComponent)) {
        return;
      }

      const [arg] = node.arguments;

      if (!t.isObjectExpression(arg)) {
        return;
      }

      for (const prop of arg.properties) {
        if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key) || prop.key.name !== 'hydrate') {
          continue;
        }

        logger.warn('Unsupported option "hydrate"', {
          file: ctx.filename,
          source: ctx.scriptData.source,
          loc: prop.key.loc,
        });

        break;
      }
    },
  };
}
