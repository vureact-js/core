import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ReactApis, RuntimeModules } from '@src/consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/setup-runtime-utils';
import { logger } from '@src/shared/logger';
import { __scriptBlockIR } from '../..';
import { isCalleeNamed } from '../../shared/babel-utils';
import { replaceVueSuffix } from '../../shared/replace-vue-suffix';

export function resolveAsyncComponent(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, 'defineAsyncComponent')) {
        path.skip();
        return;
      }

      const [arg] = node.arguments;

      checkIsUnsupported(ctx, arg);
      pushToGlobalScope(path);
      recordImport(ctx, RuntimeModules.REACT, ReactApis.lazy, true);
    },
  };
}

function checkIsUnsupported(
  ctx: ICompilationContext,
  arg?: t.ArgumentPlaceholder | t.SpreadElement | t.Expression,
) {
  if (t.isFunction(arg)) {
    checkIsDynamicImport(ctx, arg);
  } else if (t.isObjectExpression(arg)) {
    const { value } = arg.properties.find(
      (p) => t.isObjectProperty(p) && t.isIdentifier(p.key) && p.key.name === 'loader',
    ) as t.ObjectProperty;

    checkIsDynamicImport(ctx, value);

    if (arg.properties.length > 1) {
      warnMultipleOptionsUsed(ctx, arg);
    }
  }
}

function checkIsDynamicImport(ctx: ICompilationContext, node: t.Node) {
  const { source, filename } = ctx;

  const warnIsNotImport = (node?: t.Node | null) => {
    if (!node || !t.isImport(node)) {
      logger.error(
        `Only ES module dynamic imports are supported. You must use and return import('...').`,
        {
          source,
          file: filename,
          loc: node?.loc || {},
        },
      );
    }
  };

  if (t.isFunction(node)) {
    checkIsDynamicImport(ctx, node.body);
    return;
  }

  if (t.isBlockStatement(node)) {
    const [returnSmt] = node.body;

    if (t.isReturnStatement(returnSmt)) {
      warnIsNotImport(returnSmt.argument);
    }

    return;
  }

  if (t.isCallExpression(node)) {
    warnIsNotImport(node.callee);

    // 替换 import('xx.vue') -> import('xx.jsx')
    if (t.isStringLiteral(node.arguments[0])) {
      replaceVueSuffix(ctx, node.arguments[0]);
    }

    return;
  }

  // 其他类型的表达式一律不支持
  warnIsNotImport(node);
}

function warnMultipleOptionsUsed(ctx: ICompilationContext, node: t.Node) {
  const { source, filename } = ctx;
  logger.warn(
    'Only the loader option is supported. ' +
      'Other options may be implemented manually based on your needs.',
    {
      source,
      file: filename,
      loc: node.loc!,
    },
  );
}

function pushToGlobalScope(path: NodePath<t.CallExpression>) {
  const { node } = path;
  const callee = node.callee as t.Identifier;

  callee.name = ReactApis.lazy;
  callee.loc!.identifierName = ReactApis.lazy;

  // 移除 defineAsyncComponent 的泛型参数，不兼容 React.lazy
  if (node.typeParameters) {
    node.typeParameters = undefined;
  }

  let declarationPath: NodePath | null = path.parentPath;

  while (declarationPath) {
    if (declarationPath.isVariableDeclaration()) {
      break;
    }
    declarationPath = declarationPath.parentPath;
  }

  let fullNode;

  if (declarationPath?.isVariableDeclaration()) {
    fullNode = declarationPath.node;
    declarationPath.remove();
  } else if (path.parentPath.isVariableDeclarator()) {
    fullNode = path.parent;
    path.parentPath.remove();
  } else {
    fullNode = path.node;
    path.remove();
  }

  const { statement } = __scriptBlockIR;
  statement.global.push(fullNode as t.Statement);
}
