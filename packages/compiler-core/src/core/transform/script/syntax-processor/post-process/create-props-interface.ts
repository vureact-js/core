import * as t from '@babel/types';
import { PropsIntersectionType } from '@src/core/transform/const';
import { compileContext } from '@src/shared/compile-context';
import { __scriptBlockIR } from '../..';

export function createPropsIntersectionType() {
  const { lang } = compileContext.context;
  const { tsTypes, defineProps } = __scriptBlockIR;
  const { propsType, eventType, slotType } = defineProps.typeAnnotation;

  if (!lang.script.startsWith('ts') || !propsType.tsType || !eventType.tsType || !slotType.tsType) {
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
