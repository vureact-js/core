import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { compileContext } from '@src/shared/compile-context';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { __scriptBlockIR, DefinePropItem } from '../..';
import { createPropsProcessor, PropDescribe } from './processor-factory';

export function processDefinePropsEmitsApi(): TraverseOptions {
  const { lang } = compileContext.context;
  const { defineProp } = __scriptBlockIR;
  const isTS = lang.script.startsWith('ts');

  return {
    CallExpression(path) {
      createPropsProcessor(path, {
        onProcessed(type, describe) {
          const props =
            type === 'defineProps'
              ? normalizeProps(describe, isTS)
              : normalizeEmits(describe, isTS);

          defineProp.items.push(props);
          defineProp.multiple = defineProp.items.length > 1;
        },
      });
    },
  };
}

// 通用规范化函数，props 直接使用 key，emits 转换为 onX
function normalizeRuntimeExp(
  arg: any[],
  keyNormalizer: (k: string) => string = (k) => k,
): t.SpreadElement | t.ObjectPattern {
  if (!arg.length) return t.objectPattern([]);

  const first = arg[0];
  if (t.isArrayExpression(first)) {
    return arrayToObjectPattern(first, keyNormalizer);
  } else if (t.isObjectExpression(first)) {
    return objectToObjectPattern(first, keyNormalizer);
  } else if (t.isSpreadElement(first)) {
    return first;
  }
  return t.objectPattern([t.restElement(t.identifier('restProps'))]);
}

function normalizeProps(describe: PropDescribe, isTS: boolean): DefinePropItem {
  const { id, arg, tsType } = describe;
  return {
    id,
    exp: isTS && tsType ? t.objectPattern([]) : normalizeRuntimeExp(arg),
    tsType,
  };
}

function normalizeEmits(describe: PropDescribe, isTS: boolean): DefinePropItem {
  const { id, arg, tsType } = describe;
  const newTs = isTS && tsType ? transformEmitTsType(tsType) : undefined;
  return {
    id,
    exp: newTs ? t.objectPattern([]) : normalizeRuntimeExp(arg, eventToPropName),
    tsType: newTs,
  };
}

function eventToPropName(name: string): string {
  if (!name) return '';
  if (name.startsWith('update:')) {
    return `onUpdate${capitalize(camelCase(name.slice(7)))}`;
  }
  return `on${capitalize(camelCase(name))}`;
}

// 提取 key 名称（字符串字面量或标识符）
function extractKeyName(node: any): string | null {
  if (t.isStringLiteral(node)) return node.value;
  if (t.isIdentifier(node)) return node.name;
  return null;
}

// 创建简写对象属性：key: key
function createShorthandProperty(key: string): t.ObjectProperty {
  const id = t.identifier(key);
  return t.objectProperty(id, id, false, true);
}

// 统一的数组转对象模式
function arrayToObjectPattern(
  array: t.ArrayExpression,
  keyNormalizer: (k: string) => string = (k) => k,
): t.ObjectPattern {
  const properties: t.ObjectProperty[] = [];
  for (const element of array.elements) {
    if (element && !t.isSpreadElement(element)) {
      const name = extractKeyName(element);
      if (name) {
        const key = keyNormalizer(name);
        properties.push(createShorthandProperty(key));
      }
    }
  }
  return t.objectPattern(properties);
}

// 统一的对象表达式转对象模式
function objectToObjectPattern(
  obj: t.ObjectExpression,
  keyNormalizer: (k: string) => string = (k) => k,
): t.ObjectPattern {
  const properties: t.ObjectProperty[] = [];
  for (const prop of obj.properties) {
    if (t.isObjectProperty(prop) && !prop.computed) {
      const keyName = extractKeyName(prop.key);
      if (keyName) {
        const key = keyNormalizer(keyName);
        properties.push(createShorthandProperty(key));
      }
    } else if (t.isSpreadElement(prop)) {
      properties.push(prop as unknown as t.ObjectProperty);
    }
  }
  return t.objectPattern(properties);
}

function transformEmitTsType(
  tsType: t.TSTypeParameterInstantiation,
): t.TSTypeParameterInstantiation {
  const params = tsType.params;
  if (!params?.length || !t.isTSTypeLiteral(params[0])) return tsType;

  const members: t.TSTypeElement[] = [];
  for (const m of params[0].members) {
    if (
      t.isTSPropertySignature(m) &&
      !m.computed &&
      (t.isIdentifier(m.key) || t.isStringLiteral(m.key))
    ) {
      const rawKey = t.isIdentifier(m.key) ? m.key.name : m.key.value;
      const propKey = eventToPropName(rawKey);
      const newProp = t.tsPropertySignature(t.identifier(propKey));

      if (m.typeAnnotation?.typeAnnotation) {
        const ta = m.typeAnnotation.typeAnnotation;
        const newType = t.isTSTupleType(ta)
          ? tupleToFnType(ta)
          : t.isTSArrayType(ta)
            ? arrayToFnType(ta)
            : ta;
        newProp.typeAnnotation = t.tsTypeAnnotation(newType);
      }
      members.push(newProp);
    } else if (t.isTSCallSignatureDeclaration(m)) {
      const prop = callSigToProperty(m);
      if (prop) members.push(prop);
    }
  }

  return t.tsTypeParameterInstantiation([t.tsTypeLiteral(members)]);
}

function tupleToFnType(tuple: t.TSTupleType): t.TSType {
  const fnParams = tuple.elementTypes.map((el, idx) => {
    const id = t.identifier(
      el && typeof el === 'object' && 'label' in el && (el as any).label
        ? t.isIdentifier((el as any).label)
          ? (el as any).label.name
          : `arg${idx}`
        : `arg${idx}`,
    );
    const elemType =
      el && typeof el === 'object' && 'elementType' in el ? (el as any).elementType : el;
    id.typeAnnotation = t.tsTypeAnnotation(elemType as any);
    return id;
  });

  return {
    type: 'TSFunctionType',
    parameters: fnParams as any,
    returnType: t.tsTypeAnnotation(t.tsAnyKeyword()),
  } as any;
}

function arrayToFnType(arr: t.TSArrayType): t.TSType {
  const id = t.identifier('args');
  id.typeAnnotation = t.tsTypeAnnotation(arr as any);
  return {
    type: 'TSFunctionType',
    parameters: [t.restElement(id)] as any,
    returnType: t.tsTypeAnnotation(t.tsAnyKeyword()),
  } as any;
}

function callSigToProperty(m: t.TSCallSignatureDeclaration): t.TSPropertySignature | null {
  const params = m.parameters || [];
  if (!params.length) return null;

  const first = params[0];
  if (!t.isIdentifier(first) || !first.typeAnnotation || t.isNoop(first.typeAnnotation))
    return null;

  const ta = first.typeAnnotation.typeAnnotation;
  if (!t.isTSLiteralType(ta) || !t.isStringLiteral(ta.literal)) return null;

  const eventName = ta.literal.value;
  const propKey = eventToPropName(eventName);

  const fnParams = params.slice(1).filter((p): p is t.Identifier | t.RestElement => {
    if (t.isIdentifier(p) || (t.isRestElement(p) && t.isIdentifier(p.argument))) {
      return true;
    }
    return false;
  });

  const returnType = m.typeAnnotation?.typeAnnotation || t.tsAnyKeyword();
  const fnType = {
    type: 'TSFunctionType',
    parameters: fnParams as any,
    returnType: t.tsTypeAnnotation(returnType as any),
  } as any;

  const propSig = t.tsPropertySignature(t.identifier(propKey));
  propSig.typeAnnotation = t.tsTypeAnnotation(fnType);
  return propSig;
}
