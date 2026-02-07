import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';

/**
 * 解决 defineProps TS 类型注释
 */
export function resolveDefinePropsIface(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
) {
  const { node } = path;
  const [runtimeArg] = node.arguments;
  const tsParams = node.typeParameters?.params;

  // 优先使用显式定义的 TS 类型
  if (tsParams?.length) {
    const { propsTSIface } = ctx.scriptData;
    propsTSIface.propsTypes = tsParams;
    return;
  }

  processInferredTypes(ctx, runtimeArg);
}

// 处理需推断生成的运行时类型签名
function processInferredTypes(
  ctx: ICompilationContext,
  runtimeArg: t.Expression | t.SpreadElement | t.ArgumentPlaceholder | undefined,
) {
  const { filename, scriptData } = ctx;
  const {
    source,
    propsTSIface: { propsTypes },
  } = scriptData;

  if (!runtimeArg) return;

  const members: t.TSTypeElement[] = [];

  // 处理数组写法
  if (t.isArrayExpression(runtimeArg)) {
    for (const element of runtimeArg.elements) {
      if (!element || !t.isStringLiteral(element)) continue;

      const key = t.isValidIdentifier(element.value)
        ? t.identifier(element.value)
        : t.stringLiteral(element.value);

      const prop = t.tsPropertySignature(key, t.tsTypeAnnotation(t.tsAnyKeyword()));

      prop.optional = true;
      members.push(prop);
    }

    if (members.length) {
      propsTypes.push(t.tsTypeLiteral(members));
    }

    return;
  }

  // 处理对象写法
  if (t.isObjectExpression(runtimeArg)) {
    for (const prop of runtimeArg.properties) {
      if (!t.isObjectProperty(prop)) continue;
      if (t.isSpreadElement(prop)) continue;

      const key = prop.key;
      let propName: string | null = null;

      if (t.isIdentifier(key)) propName = key.name;
      if (t.isStringLiteral(key)) propName = key.value;
      if (t.isNumericLiteral(key)) propName = String(key.value);
      if (!propName) continue;

      const { type, required } = resolveRuntimePropMeta(prop.value);
      const tsType = type ?? t.tsAnyKeyword();

      const tsKey = t.isValidIdentifier(propName)
        ? t.identifier(propName)
        : t.stringLiteral(propName);

      const tsProp = t.tsPropertySignature(tsKey, t.tsTypeAnnotation(tsType));

      tsProp.optional = !required;
      members.push(tsProp);
    }

    if (members.length) {
      propsTypes.push(t.tsTypeLiteral(members));
    }

    return;
  }

  logger.error(
    'Unsupported dynamic props reference. ' +
      'Please use literal array / object or type - based defineProps for better stability.',
    {
      source,
      file: filename,
      loc: runtimeArg?.loc!,
    },
  );
}

function resolveRuntimePropMeta(value: t.Expression | t.PatternLike): {
  type?: t.TSType;
  required: boolean;
} {
  if (t.isIdentifier(value)) {
    return {
      type: mapRuntimeTypeToTSType(value),
      required: false,
    };
  }

  if (t.isArrayExpression(value)) {
    return {
      type: resolveRuntimeUnionType(value),
      required: false,
    };
  }

  if (!t.isObjectExpression(value)) {
    return { required: false };
  }

  let type: t.TSType | undefined;
  let required = false;

  for (const prop of value.properties) {
    if (!t.isObjectProperty(prop)) continue;
    if (t.isSpreadElement(prop)) continue;

    const key = prop.key;
    const propName = t.isIdentifier(key) ? key.name : t.isStringLiteral(key) ? key.value : null;

    if (!propName) continue;

    if (propName === 'type') {
      const valueNode = prop.value as t.Expression;

      if (t.isArrayExpression(valueNode)) {
        type = resolveRuntimeUnionType(valueNode);
        continue;
      }

      if (t.isIdentifier(valueNode)) {
        type = mapRuntimeTypeToTSType(valueNode);
        continue;
      }
    }

    if (propName === 'required') {
      if (t.isBooleanLiteral(prop.value)) {
        required = prop.value.value;
      }
    }
  }

  return { type, required };
}

function resolveRuntimeUnionType(value: t.ArrayExpression): t.TSType {
  const types: t.TSType[] = [];

  for (const element of value.elements) {
    if (!element || !t.isIdentifier(element)) continue;

    const resolved = mapRuntimeTypeToTSType(element);

    if (resolved) types.push(resolved);
  }

  if (!types.length) return t.tsAnyKeyword();
  if (types.length === 1) return types[0]!;

  return t.tsUnionType(types);
}

function mapRuntimeTypeToTSType(value: t.Identifier): t.TSType | undefined {
  switch (value.name) {
    case 'String':
      return t.tsStringKeyword();

    case 'Number':
      return t.tsNumberKeyword();

    case 'Boolean':
      return t.tsBooleanKeyword();

    case 'Object':
      return t.tsTypeLiteral([]);

    case 'Array':
      return t.tsArrayType(t.tsAnyKeyword());

    case 'Function':
      return t.tsFunctionType(null, [], t.tsTypeAnnotation(t.tsAnyKeyword()));

    case 'Symbol':
      return t.tsSymbolKeyword();

    case 'BigInt':
      return t.tsBigIntKeyword();

    default:
      return t.tsAnyKeyword();
  }
}
