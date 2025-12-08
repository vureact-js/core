import { ParseResult as BabelParseResult } from '@babel/parser';
import { logger } from '@shared/logger';
import { CompilerError, RootNode } from '@vue/compiler-core';
import {
  parse as parseVueSFC,
  SFCScriptBlock,
  SFCStyleBlock,
  SFCTemplateBlock,
} from '@vue/compiler-sfc';
import { parseScript } from './script';
import { parseTemplate } from './template';

export interface ParseOptions {
  filename: string;
}

export interface VueASTDescriptor {
  template: ASTBlock<SFCTemplateBlock, RootNode>;
  script: ASTBlock<SFCScriptBlock, BabelParseResult>;
  styles: SFCStyleBlock[];
  meta: {
    filename: string;
    source: string;
    cssVars: string[];
  };
}

export type ASTBlock<S, T> = {
  source?: S;
  ast: T;
} | null;

export function parse(vueCode: string, options?: Partial<ParseOptions>): VueASTDescriptor {
  const { descriptor, errors } = parseVueSFC(vueCode, { filename: options?.filename });
  
  const { template, script, scriptSetup, styles, filename, source, cssVars } = descriptor;

  if (errors.length) {
    errors.forEach((err) => {
      logger.error(err.message, {
        source,
        file: descriptor.filename,
        loc: (err as CompilerError).loc,
      });
    });
  }

  return {
    template: parseTemplate(template),
    script: parseScript(script || scriptSetup),
    styles,
    meta: {
      filename,
      source,
      cssVars,
    },
  };
}
