import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { logger } from '@shared/logger';
import { recordImport } from '@transform/shared';
import { getScriptIR } from '../..';
import { isCalleeNamed } from '../../shared/babel-utils';
import { replaceVueSuffix } from '../../shared/replace-vue-suffix';

export function resolveDefineAsyncComponent(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, VUE_API_MAP.defineAsyncComponent)) {
        return;
      }

      const [arg] = node.arguments;

      checkIsUnsupported(ctx, arg);
      pushToGlobalScope(path, ctx);

      recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.lazy);
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
  const { scriptData, filename } = ctx;

  const warnIsNotImport = (target?: t.Node | null) => {
    if (!target || !t.isImport(target)) {
      logger.error(
        `Only ES module dynamic imports are supported. You must use and return import('...').`,
        {
          source: scriptData.source,
          file: filename,
          loc: target?.loc || {},
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

    // import('xx.vue') -> import('xx.jsx')
    if (t.isStringLiteral(node.arguments[0])) {
      replaceVueSuffix(node.arguments[0]);
    }

    return;
  }

  warnIsNotImport(node);
}

function warnMultipleOptionsUsed(ctx: ICompilationContext, node: t.Node) {
  const { scriptData, filename } = ctx;
  logger.warn(
    'Only the loader option is supported. Other options may be implemented manually based on your needs.',
    {
      source: scriptData.source,
      file: filename,
      loc: node.loc,
    },
  );
}

function pushToGlobalScope(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  const { node } = path;
  const callee = node.callee as t.Identifier;

  callee.name = REACT_API_MAP.lazy;
  callee.loc!.identifierName = REACT_API_MAP.lazy;

  // remove defineAsyncComponent<T> generic params
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

  const scriptIR = getScriptIR(ctx);
  scriptIR.statement.global.push(fullNode as t.Statement);
}
