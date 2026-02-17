import { ICompilationContext } from '@src/compiler/context/types';
import { baseParse as vueBaseParse } from '@vue/compiler-core';
import { SFCDescriptor } from '@vue/compiler-sfc';
import { ParseResult } from '..';

export function resolveTemplate(
  descriptor: SFCDescriptor,
  _: ICompilationContext,
  result: ParseResult,
) {
  const block = descriptor.template;
  if (!block?.content) return null;

  result.template = {
    ast: vueBaseParse(block.content),
    source: block,
  };
}
