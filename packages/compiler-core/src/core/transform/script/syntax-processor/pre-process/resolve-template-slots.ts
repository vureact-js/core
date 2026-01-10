import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules } from '@src/consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/setup-runtime-utils';
import { __scriptBlockIR, PropTSInterface } from '../..';
import { resolveObjectToTSType } from '../../shared/babel-utils';

/**
 * 处理 Vue 模板声明的 slot 描述，将其转换为 React 组件的 Props 类型定义。
 *
 * 合并到 __scriptBlockIR.defineProps
 */
export function processTemplateSlots(ctx: ICompilationContext) {
  const { defineProps } = __scriptBlockIR;
  const tsTypeElement = createTSTypeElement(ctx);

  if (!tsTypeElement.length) return;

  recordImport(ctx, RuntimeModules.REACT, 'ReactNode', true);
  resolvePropTSInterface(defineProps.typeAnnotation.slotType, tsTypeElement);
}

// 通过模板的 slot 描述对象创建 TSTypeElement
function createTSTypeElement(ctx: ICompilationContext): t.TSTypeElement[] {
  const { templateData } = ctx;

  const tsTypeElement: t.TSTypeElement[] = [];
  const ReactNodeType = t.tsTypeReference(t.identifier('ReactNode'));

  for (const key in templateData.slots) {
    const props = templateData.slots[key]!;
    const hasProps = Object.keys(props).length;

    let typeNode: t.TSTypeReference | t.TSFunctionType = ReactNodeType;

    if (hasProps) {
      const param = t.identifier('data');
      const tsParamType = resolveObjectToTSType(ctx, props) as unknown as t.TSType;

      param.typeAnnotation = t.tsTypeAnnotation(tsParamType);
      typeNode = t.tsFunctionType(null, [param], t.tsTypeAnnotation(ReactNodeType));
    }

    const id = t.identifier(key);
    const propSignature = t.tsPropertySignature(id, t.tsTypeAnnotation(typeNode));

    propSignature.optional = true;
    tsTypeElement.push(propSignature);
  }

  return tsTypeElement;
}

export function resolvePropTSInterface(
  p: PropTSInterface,
  body: t.TSTypeElement[],
  _extends?: Array<t.TSExpressionWithTypeArguments>,
) {
  const iface = t.tsInterfaceDeclaration(
    p.id.typeName as t.Identifier,
    null,
    _extends,
    t.tsInterfaceBody(body),
  );

  const { tsTypes } = __scriptBlockIR;

  // 如果已有同名接口则替换，否则追加
  const exists = tsTypes.some((ts) => {
    if (t.isTSInterfaceDeclaration(ts) && ts.id.name === iface.id.name) {
      ts.body = iface.body;
      return true;
    }
    return false;
  });

  if (!exists) tsTypes.push(iface);

  p.tsType = iface;
}
