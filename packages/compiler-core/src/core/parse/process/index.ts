import { ICompilationContext } from '@compiler/context/types';
import { SFCDescriptor } from '@vue/compiler-sfc';
import { ParseResult } from '..';
import { resolveScript } from './resolve-script';
import { resolveScriptMeta } from './resolve-script-meta';
import { resolveStyles } from './resolve-styles';
import { resolveTemplate } from './resolve-template';

interface ProcessorOptions {
  process?: Processor[];
  postprocess?: PostProcessor[];
}

type Processor = (descriptor: SFCDescriptor, ctx: ICompilationContext, result: ParseResult) => void;

type PostProcessor = (result: ParseResult, ctx: ICompilationContext) => void;

export function processVueSyntax(
  descriptor: SFCDescriptor,
  ctx: ICompilationContext,
  result: ParseResult,
): ParseResult {
  vueSyntaxProcessor(descriptor, ctx, result, {
    process: [resolveTemplate, resolveScript, resolveStyles],
    postprocess: [resolveScriptMeta],
  });

  return result;
}

function vueSyntaxProcessor(
  descriptor: SFCDescriptor,
  ctx: ICompilationContext,
  result: ParseResult,
  options: ProcessorOptions,
) {
  const run = (p?: (Processor | PostProcessor)[], type?: string) => {
    p?.forEach((handler) => {
      if (type === 'post') {
        (handler as PostProcessor)(result, ctx);
        return;
      }

      (handler as Processor)(descriptor, ctx, result);
    });
  };

  run(options.process);
  run(options.postprocess, 'post');
}
