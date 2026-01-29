import { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext, IRModelEventHandler } from '@compiler/context/types';
import { ReactApis, RuntimeModules } from '@consts/runtimeModules';
import { recordImport } from '@core/transform/shared/setup-runtime-utils';
import { resolveTemplateExp } from '@core/transform/template/shared/resolve-str-exp';
import { createUseCallback } from '../../shared/hook-creator';

/**
 * 模板转换阶段会把 v-model 记录成事件描述 ast，
 * 因此根据 ast 生成对应的 babel 箭头函数声明表达式。
 *
 * v-model="foo" => 对应 React 事件 onFooChange
 */
export function insertVModelEventHandlers(ctx: ICompilationContext, ast: ParseResult) {
  const {
    templateData: { models },
  } = ctx;

  const defineHandlerStmts: t.Statement[] = models.map(({ handler }) =>
    resolveEventHandler(ctx, handler),
  );

  ast.program.body.push(...defineHandlerStmts);
}

function resolveEventHandler(
  ctx: ICompilationContext,
  handler: IRModelEventHandler['handler'],
): t.VariableDeclaration {
  const {
    arg,
    body: { setterExp },
  } = handler.exp;

  const stateSetter = t.callExpression(t.identifier(setterExp.name), [
    t.arrowFunctionExpression(
      [t.identifier(setterExp.arg)],
      t.blockStatement([
        t.expressionStatement(resolveTemplateExp(ctx, setterExp.body, false, 'expression')),
        t.returnStatement(t.identifier(setterExp.arg)),
      ]),
    ),
  ]);

  const useCallback = createUseCallback(
    t.arrowFunctionExpression(
      [t.identifier(arg)],
      t.blockStatement([t.expressionStatement(stateSetter)]),
    ),
    [],
  );

  const declaration = t.variableDeclarator(t.identifier(handler.name), useCallback);

  recordImport(ctx, RuntimeModules.REACT, ReactApis.useCallback, true);

  return t.variableDeclaration('const', [declaration]);
}
