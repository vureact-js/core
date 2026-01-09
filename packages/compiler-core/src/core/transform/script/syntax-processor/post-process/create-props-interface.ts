import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PropsIntersectionType } from '@src/core/transform/const';
import { __scriptBlockIR } from '../..';

export function createPropsIntersectionType(ctx: ICompilationContext) {
  const { scriptData } = ctx;
  const { tsTypes, defineProps } = __scriptBlockIR;
  const { propsType, eventType, slotType } = defineProps.typeAnnotation;

  if (
    !scriptData.lang.startsWith('ts') ||
    !propsType.tsType ||
    !eventType.tsType ||
    !slotType.tsType
  ) {
    return;
  }

  const tsTypeReference: t.TSTypeReference[] = [];

  if (propsType.tsType) {
    tsTypeReference.push(propsType.id);
  }

  if (eventType.tsType) {
    tsTypeReference.push(eventType.id);
  }

  if (slotType.tsType) {
    tsTypeReference.push(slotType.id);
  }

  const newType = t.tsTypeAliasDeclaration(
    t.identifier(PropsIntersectionType),
    null,
    t.tsIntersectionType(tsTypeReference),
  );

  tsTypes.push(newType);
}
