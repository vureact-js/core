import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ReactApis, RuntimeModules } from '@src/consts/runtimeModules';
import { compileContext } from '@src/shared/compile-context';
import { logger } from '@src/shared/logger';
import { recordImport } from '@src/shared/runtime-utils';
import { __scriptBlockIR } from '../..';
import { isCalleeNamed } from '../../shared/babel-utils';
import { replaceVueSuffix } from '../../shared/replace-vue-suffix';

export function resolveAsyncComponent(): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, 'defineAsyncComponent')) {
        path.skip();
        return;
      }

      const [arg] = node.arguments;

      checkIsUnsupported(arg);
      pushToModuleScope(path);
      recordImport(RuntimeModules.REACT, ReactApis.lazy, true);
    },
  };
}

function checkIsUnsupported(arg?: t.ArgumentPlaceholder | t.SpreadElement | t.Expression) {
  if (t.isFunction(arg)) {
    checkIsDynamicImport(arg);
  } else if (t.isObjectExpression(arg)) {
    const { value } = arg.properties.find(
      (p) => t.isObjectProperty(p) && t.isIdentifier(p.key) && p.key.name === 'loader',
    ) as t.ObjectProperty;

    checkIsDynamicImport(value);

    if (arg.properties.length > 1) {
      warnMultipleOptionsUsed(arg);
    }
  }
}

function checkIsDynamicImport(node: t.Node) {
  const { source, filename } = compileContext.context;

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
    checkIsDynamicImport(node.body);
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
      replaceVueSuffix(node.arguments[0]);
    }

    return;
  }

  // 其他类型的表达式一律不支持
  warnIsNotImport(node);
}

function warnMultipleOptionsUsed(node: t.Node) {
  const { source, filename } = compileContext.context;
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

function pushToModuleScope(path: NodePath<t.CallExpression>) {
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

  const { moduleScope } = __scriptBlockIR.statement;
  moduleScope.push(fullNode as t.Statement);
}
