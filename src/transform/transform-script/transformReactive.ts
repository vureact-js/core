import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { REACTIVE_TYPE, VUE_REACTIVE_APIS } from '@constants/vue';
import type { ExtendedVariableDeclarator } from '@parse/types';
import { isSimpleExpression } from '@transform/utils';
import { logger } from '@transform/utils/logger';
import { isUndefined } from '@utils/types';
import type { ReactiveBinding, ScriptTransformContext } from './types';
import { collectDependencies, createUseImmer, createUseMemo, createUseState } from './utils';

export function transformReactive(ast: t.File, ctx: ScriptTransformContext) {
  traverse(ast, {
    VariableDeclaration(path) {
      path.get('declarations').forEach((declPath) => {
        const decl = declPath.node as ExtendedVariableDeclarator;
        if (decl?.reactiveType) {
          if (t.isCallExpression(decl.init) && t.isIdentifier(decl.init.callee)) {
            const initName = decl.init.callee.name;
            if (
              initName === VUE_REACTIVE_APIS.defineProps ||
              initName === VUE_REACTIVE_APIS.defineEmits
            ) {
              return;
            }
          }
          const replacement = mapReactive(declPath, ctx);
          if (!isUndefined(replacement)) {
            declPath.replaceWith(replacement);
          }
        }
      });
    },
  });
}

function mapReactive(declPath: NodePath<ExtendedVariableDeclarator>, ctx: ScriptTransformContext) {
  const decl = declPath.node;
  const reactiveType = decl.reactiveType!;
  const name = t.isIdentifier(decl.id) ? decl.id.name : '';

  if (!decl.init || !t.isCallExpression(decl.init)) {
    logger.error(
      decl,
      `Reactive declaration "${name}" (${reactiveType}) missing init CallExpression; skipping transform`,
    );
    return decl;
  }

  const initCall = decl.init;
  const initArg = initCall.arguments[0] ?? t.nullLiteral();
  const isComplex = !isSimpleExpression(initArg);

  const getHook = () => {
    switch (reactiveType) {
      // ref - 简单值用 useState，复杂值用 useImmer
      case REACTIVE_TYPE.ref: {
        return isComplex
          ? createUseImmer(name, initArg, decl)
          : createUseState(name, initArg, decl);
      }

      // reactive/toRefs - 总是用 useImmer（处理对象/数组）
      case REACTIVE_TYPE.reactive:
      case REACTIVE_TYPE.toRefs: {
        return createUseImmer(name, initArg, decl);
      }

      // shallowRef/shallowReactive - 用 useState（保持浅层响应）
      case REACTIVE_TYPE.shallowRef:
      case REACTIVE_TYPE.shallowReactive: {
        return createUseState(name, initArg, decl);
      }

      // computed - 使用 useMemo
      case REACTIVE_TYPE.computed: {
        if (!t.isFunctionExpression(initArg) && !t.isArrowFunctionExpression(initArg)) {
          logger.error(initArg, 'computed API must pass in a callback and have a return value');
        }
        const deps = collectDependencies(declPath.get('init') as NodePath<t.Expression>, ctx);
        const memo = createUseMemo(initArg, deps, name, decl);
        return memo;
      }

      // toRef - 创建对象属性的引用，用 useState
      case REACTIVE_TYPE.toRef: {
        if (!t.isCallExpression(decl.init)) {
          logger.error(
            decl,
            `toRef API transform failed for "${name}": Initial value is not a function`,
          );
          return decl;
        }

        const args = decl.init.arguments;
        if (!args || args.length < 2) {
          logger.error(
            decl,
            `toRef API transform failed for "${name}": Requires two arguments (source, property)`,
          );
          return decl;
        }

        const obj = args[0] as t.Expression;
        const propArg = args[1];
        let propName: string | null = null;

        if (t.isStringLiteral(propArg)) {
          propName = propArg.value;
        } else if (t.isIdentifier(propArg)) {
          propName = propArg.name;
        } else {
          logger.error(
            decl,
            `toRef API transform failed for "${name}": Invalid property argument type`,
          );
          return decl;
        }

        // toRef 应该创建对象属性的直接引用
        const refExpr = t.memberExpression(obj, t.identifier(propName));
        return createUseState(name, refExpr, decl);
      }

      // shallowReadonly & readonly - 使用 useMemo + Object.freeze
      case REACTIVE_TYPE.readonly: {
        logger.warn(
          decl,
          'Vue readonly is deep read-only, but in React it will be converted to useMemo + Object.freeze, read-only and shallow freezing.',
        );
      }
      case REACTIVE_TYPE.shallowReadonly: {
        const readOnlyObj = t.memberExpression(t.identifier('Object'), t.identifier('freeze'));
        const frozen = t.callExpression(readOnlyObj, [initArg]);
        return createUseMemo(t.arrowFunctionExpression([], frozen), [], name, decl);
      }

      default: {
        logger.warn(
          decl,
          `Unsupported reactive type "${reactiveType}" for declaration "${name}"; leaving as-is`,
        );
        return decl;
      }
    }
  };

  ctx.reactiveBindings.push({
    name,
    reactiveType,
    isComplex,
    isReactive: decl.isReactive ?? true,
  } as ReactiveBinding);

  return getHook();
}
