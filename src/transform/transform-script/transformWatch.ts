import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { VUE_REACTIVE_APIS } from '@constants/vue';
import { logger } from '@transform/utils/logger';
import { isUndefined } from '@utils/types';
import type { ScriptTransformContext } from './types';
import {
  collectDependencies,
  createUseDeepUpdateEffect,
  createUseEffect,
  createUseEffectOnce,
  createUseUpdateEffect,
  isAsyncFunc,
} from './utils';

export function transformHooks(ast: t.File, ctx: ScriptTransformContext) {
  traverse(ast, {
    CallExpression(path) {
      const { callee } = path.node;
      if (t.isIdentifier(callee)) {
        const { name } = callee;
        if (name === VUE_REACTIVE_APIS.watch || name === VUE_REACTIVE_APIS.watchEffect) {
          const replacement = mapWatchHook(path, name, ctx);
          if (!isUndefined(replacement)) {
            path.replaceWith(replacement);
            path.addComment('leading', ` ${name}`, true);
          }
        }
      }
    },
  });
}

function mapWatchHook(
  path: NodePath<t.CallExpression>,
  hookName: string,
  ctx: ScriptTransformContext,
): t.CallExpression {
  const { node: call } = path;
  const isWatchEffect = hookName === VUE_REACTIVE_APIS.watchEffect;

  const sourceArgs = path.get('arguments.0') as NodePath<t.Expression>;
  const callbackArgs = path.get('arguments.1') as NodePath<t.Expression | t.Statement>;

  const sourcePath = !isWatchEffect ? sourceArgs : null;
  const callbackPath = !isWatchEffect ? callbackArgs : sourceArgs;
  const callback = callbackPath.node;
  const watchOptions = !isWatchEffect ? call.arguments[2] : null;

  if (!callback || (!t.isFunctionExpression(callback) && !t.isArrowFunctionExpression(callback))) {
    logger.error(call, `Vue ${hookName} missing/invalid callback; using default useEffect`);
    return createUseEffect(t.arrowFunctionExpression([], t.blockStatement([])), []);
  }

  if (callback.params.length) {
    logger.warn(
      callback,
      `Vue ${hookName} callback has parameters; transforming without params (may cause undefined vars)`,
    );
    callback.params.length = 0;
  }

  const deps = isWatchEffect
    ? collectDependencies(callbackPath, ctx)
    : extractWatchSourceDeps(sourcePath!, ctx);

  if (isWatchEffect) return createUseEffect(callback, deps);

  // handle watch
  let effect = createUseUpdateEffect(callback, deps);

  // get effect by watch options
  const getEffectByWatchOptions = () => {
    let result: t.CallExpression | undefined;
    if (watchOptions && t.isObjectExpression(watchOptions)) {
      if (watchOptions.properties.length > 1) {
        logger.warn(
          watchOptions,
          `Vue ${hookName} has multiple options; only first takes effect (React Hook limit)`,
        );
      }
      watchOptions.properties.some((prop) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const { name } = prop.key;
          if (t.isBooleanLiteral(prop.value) && prop.value) {
            if (name === 'immediate') {
              result = createUseEffect(callback, deps);
              return true;
            }
            if (name === 'once') {
              if (isAsyncFunc(callback)) {
                logger.warn(
                  prop.key,
                  `Watch with 'once' option: Async callbacks unsupported. Consider using with async inside`,
                );
              }

              result = createUseEffectOnce(callback);
              return true;
            }
            if (name === 'deep') {
              if (isAsyncFunc(callback)) {
                logger.warn(
                  prop.key,
                  `Watch with 'deep' option: Async callbacks skip deep comparison. Consider using with async inside`,
                );
              }

              result = createUseDeepUpdateEffect(callback, deps);
              return true;
            }
          } else if (name === 'flush' && t.isStringLiteral(prop.value)) {
            logger.warn(
              prop.key,
              `Watch 'flush' option unsupported; ignoring (use default post timing)`,
            );
            return true;
          }
        }
      });
    }
    return result;
  };

  return getEffectByWatchOptions() ?? effect;
}

function extractWatchSourceDeps(
  sourcePath: NodePath<t.Expression>,
  ctx: ScriptTransformContext,
): string[] {
  const { node: source } = sourcePath;
  let deps: string[] = [];

  if (t.isIdentifier(source)) {
    deps = [source.name];
  } else if (t.isArrayExpression(source)) {
    // 数组：直接解构为依赖 / Array: Destructure to deps
    deps = source.elements
      .filter((el) => t.isIdentifier(el))
      .map((el) => (el as t.Identifier).name);
  } else if (t.isArrowFunctionExpression(source) || t.isFunctionExpression(source)) {
    // 函数：收集返回值依赖 / Function: Collect deps from return value
    const bodyPath = sourcePath.get('body') as NodePath<t.BlockStatement | t.Expression>;
    const body = bodyPath.node;

    if (t.isBlockStatement(body)) {
      const returnPath = bodyPath.get('body').find((p) => p.isReturnStatement()) as
        | NodePath<t.ReturnStatement>
        | undefined;
      if (returnPath?.node.argument) {
        const argPath = returnPath.get('argument') as NodePath<t.Expression>;
        if (t.isArrayExpression(returnPath.node.argument)) {
          deps = extractWatchSourceDeps(argPath, ctx); // 递归处理返回数组 / Recurse array
        } else {
          deps = collectDependencies(argPath, ctx);
        }
      } else {
        logger.warn(
          body,
          `The watch getter does not return a reactive state. Consider using watchEffect instead.`,
        );
      }
    } else if (t.isExpression(body)) {
      // 隐式返回 / Implicit return
      if (t.isArrayExpression(body)) {
        deps = body.elements
          .filter((el) => t.isIdentifier(el))
          .map((el) => (el as t.Identifier).name);
      } else {
        deps = collectDependencies(bodyPath, ctx);
      }
    }
  } else if (t.isMemberExpression(source) || t.isCallExpression(source)) {
    // Getter 或复杂表达式：收集内部依赖 / Getter/complex: Collect inner deps
    deps = collectDependencies(sourcePath, ctx);
  } else {
    logger.warn(source, `Unsupported Watch source type; using empty deps []`);
  }
  return deps;
}
