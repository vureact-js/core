import * as t from '@babel/types';
import type { EmitDefinition } from '@transform/transform-script/types';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function createSetterName(name: string, prefix = 'set'): string {
  return `${prefix}${capitalize(name)}`;
}

export function isSimpleExpression(expr: any): boolean {
  return (
    t.isLiteral(expr) || // 字面量：字符串、数字、布尔值等
    t.isIdentifier(expr) || // 变量引用
    t.isMemberExpression(expr) || // 对象属性访问
    (t.isUnaryExpression(expr) && t.isLiteral(expr.argument)) // 一元表达式如 !true
  );
}

export function createEmitFunctionType(parameters: EmitDefinition['parameters']): t.TSFunctionType {
  if (!parameters.length) {
    return t.tSFunctionType(null, [], t.tSTypeAnnotation(t.tSVoidKeyword()));
  }

  const functionParams: t.Identifier[] = [];

  parameters.forEach((param, index) => {
    const paramName = param?.name !== `value${index}` ? param.name : `arg${index}`;
    const identifier = t.identifier(paramName);

    if (t.isTSType(param.type)) {
      identifier.typeAnnotation = t.tSTypeAnnotation(param.type);
    } else if (t.isTSNamedTupleMember(param.type)) {
      identifier.typeAnnotation = t.tSTypeAnnotation(param.type.elementType);
    } else {
      identifier.typeAnnotation = t.tSTypeAnnotation(t.tsAnyKeyword());
    }

    functionParams.push(identifier);
  });

  return t.tSFunctionType(null, functionParams, t.tSTypeAnnotation(t.tSVoidKeyword()));
}
