import * as t from '@babel/types';
import { RuntimeModules } from '@src/consts/runtimeModules';
import { compileContext } from '@src/shared/compile-context';
import { recordImport } from '@src/shared/runtime-utils';
import { __scriptBlockIR } from '../..';
import { resolveObjectToTSType } from '../../shared/babel-utils';
import { mergeTypeIntoAlias } from './resolve-props';

/**
 * 处理 Vue 模板声明的 slot 描述，将其转换为 React 组件的 Props 类型定义。
 *
 * 合并到 __scriptBlockIR.defineProps
 */
export function processTemplateSlots() {
  const { defineProps } = __scriptBlockIR;
  const { templateSlots } = compileContext.context;

  const properties: t.TSTypeElement[] = [];
  const ReactNodeType = t.tsTypeReference(t.identifier('ReactNode'));

  for (const key in templateSlots) {
    const props = templateSlots[key]!;
    const hasProps = Object.keys(props).length;

    let typeNode: t.TSTypeReference | t.TSFunctionType = ReactNodeType;

    if (hasProps) {
      const param = t.identifier('data');
      const tsParamType = resolveObjectToTSType(props) as unknown as t.TSType;

      param.typeAnnotation = t.tsTypeAnnotation(tsParamType);
      typeNode = t.tsFunctionType(null, [param], t.tsTypeAnnotation(ReactNodeType));
    }

    const id = t.identifier(key);
    const propSignature = t.tsPropertySignature(id, t.tsTypeAnnotation(typeNode));

    propSignature.optional = true;

    properties.push(propSignature);
  }

  if (!properties.length) return;

  const newType = t.tsTypeLiteral(properties);

  defineProps.tsType = mergeTypeIntoAlias(newType, defineProps.tsType);
  recordImport(RuntimeModules.REACT, 'ReactNode', true);
}
