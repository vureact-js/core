import { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext, IRModelEventHandler } from '@compiler/context/types';
import { resolveTemplateExp } from '@src/core/transform/template/shared/resolve-str-exp';
import { createUseCallback } from '../../shared/hook-creator';

/**
 * 模板转换阶段会把 v-model 记录成事件描述 ast，
 * 因此根据 ast 生成对应的 babel 箭头函数声明表达式。
 *
 * v-model="foo" => 对应 React 事件 onFooChange
 */
export function insertVModelEventHandlers(ctx: ICompilationContext, ast: ParseResult) {
  const { templateData } = ctx;

  const stmts: t.Statement[] = templateData.models.map(({ handler }) =>
    createHandlerExp(ctx, handler.name, handler.exp),
  );

  ast.program.body.push(...stmts);
}

function createHandlerExp(
  ctx: ICompilationContext,
  name: string,
  exp: IRModelEventHandler['handler']['exp'],
): t.VariableDeclaration {
  const {
    arg,
    body: { setterExp },
  } = exp;

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

  const declaration = t.variableDeclarator(t.identifier(name), useCallback);

  return t.variableDeclaration('const', [declaration]);
}
