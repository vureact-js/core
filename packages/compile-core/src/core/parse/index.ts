import { ParseResult as BabelParseResult } from '@babel/parser';
import { logger } from '@shared/logger';
import { CompilerError, RootNode } from '@vue/compiler-core';
import {
  parse as parseSFC,
  SFCDescriptor,
  SFCScriptBlock,
  SFCStyleBlock,
  SFCTemplateBlock,
} from '@vue/compiler-sfc';
import { parseSFCDescriptor } from './sfc';

export interface ParseOptions {
  filename: string;
}

export interface VueASTDescriptor {
  template: ASTBlock<SFCTemplateBlock, RootNode>;
  script: ASTBlock<SFCScriptBlock, BabelParseResult>;
  styles: SFCStyleBlock[];
  meta: SFCDescriptor;
}

export type ASTBlock<S, T> = {
  source?: S;
  ast: T;
} | null;

export function parse(source: string, options?: Partial<ParseOptions>): VueASTDescriptor {
  const { descriptor, errors } = parseSFC(source, { filename: options?.filename });

  if (errors.length) {
    errors.forEach((err) => {
      logger.error(err.message, {
        source,
        file: descriptor.filename,
        loc: (err as CompilerError).loc,
      });
    });
  }

  return parseSFCDescriptor(descriptor);
}
