import * as t from '@babel/types';
import { EDDIE_REACT_DEPS, REACT } from '@constants/react';
import type { ParsedResult } from '@parse/types';
import { isUndefined } from '@utils/types';
import type { ScriptTransformContext } from './transform-script/types';
import type { TransformedImportInfo } from './types';
import { createEmitFunctionType } from './utils';

export function mergeIntoComponent(
  vueAST: ParsedResult,
  jsxAST?: t.JSXElement,
  scriptAST?: t.File,
  hasProps = false,
): t.ExportDefaultDeclaration {
  const { componentName, script } = vueAST;

  // 创建函数组件的主体
  const bodyStatements: t.Statement[] = [];

  // 添加脚本AST中的语句（如果有）
  if (scriptAST && t.isProgram(scriptAST.program)) {
    // 从 File 类型的 scriptAST 中提取语句
    bodyStatements.push(...scriptAST.program.body);
  }

  // 添加返回JSX的语句
  const returnStatement = t.returnStatement(jsxAST || t.nullLiteral());
  bodyStatements.push(returnStatement);

  // 创建函数参数 - 添加props参数的类型注解
  const propsParam = t.identifier('');

  // 创建函数组件
  const functionComponent = t.functionDeclaration(
    t.identifier(componentName),
    [],
    t.blockStatement(bodyStatements),
  );

  if (script?.lang === 'ts') {
    if (hasProps) {
      propsParam.name = 'props';
      propsParam.typeAnnotation = t.tSTypeAnnotation(
        t.tSTypeReference(t.identifier(`${componentName}Props`)),
      );
    }
    // 添加返回类型注解
    functionComponent.returnType = t.tSTypeAnnotation(
      t.tSTypeReference(t.identifier('React.JSX.Element')),
    );
  }

  functionComponent.params = [propsParam];

  // 返回默认导出
  return t.exportDefaultDeclaration(functionComponent);
}

export function mergeImports<T extends TransformedImportInfo>(
  jsxImports?: T,
  scriptImports?: T,
): T | null {
  if (jsxImports && !scriptImports) {
    return jsxImports;
  }
  if (!jsxImports && scriptImports) {
    return scriptImports;
  }
  if (jsxImports && scriptImports) {
    const react = scriptImports[REACT].union(jsxImports[REACT]);
    const reactDeps = scriptImports[EDDIE_REACT_DEPS].union(jsxImports[EDDIE_REACT_DEPS]);
    return {
      react,
      [EDDIE_REACT_DEPS]: reactDeps,
    } as T;
  }
  return null;
}

export function mergePropsEmits(
  name: string,
  ctx?: ScriptTransformContext,
): t.TSInterfaceDeclaration | null {
  if (isUndefined(ctx) || !ctx.props.length || !ctx.emits.length) return null;

  const typeName = t.identifier(`${name}Props`);
  // 1. 合并 props & emits，创建 interface 类型定义
  const members: t.TSPropertySignature[] = [];

  // 处理 props
  if (ctx.props.length) {
    ctx.props.forEach((prop) => {
      const propSignature = t.tSPropertySignature(
        t.identifier(prop.name),
        t.tSTypeAnnotation(
          prop.required ? t.tSUnionType([prop.type, t.tSUndefinedKeyword()]) : prop.type,
        ),
      );
      propSignature.optional = prop.required;
      members.push(propSignature);
    });
  }

  // 处理 emits (在 React 中通常转换为回调函数 props)
  if (ctx.emits.length) {
    ctx.emits.forEach((emit) => {
      // 使用已经在 transformPropsEmits 中转换好的 eventName
      const emitSignature = t.tSPropertySignature(
        t.identifier(emit.eventName),
        t.tSTypeAnnotation(createEmitFunctionType(emit.parameters)),
      );
      // emits 在 React 中通常都是可选的
      emitSignature.optional = true;
      members.push(emitSignature);
    });
  }

  return t.tSInterfaceDeclaration(typeName, null, [], t.tSInterfaceBody(members));
}
