import { ParseResult as BabelParseResult } from '@babel/parser';
import { logger } from '@shared/logger';
import { compileContext } from '@src/shared/compile-context';
import { CompilerError, RootNode } from '@vue/compiler-core';
import {
  parse as parseVueSFC,
  SFCScriptBlock,
  SFCStyleBlock,
  SFCTemplateBlock,
} from '@vue/compiler-sfc';
import { parseScript } from './script';
import { parseTemplate } from './template';

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

/**
 * Parses a Vue Single File Component (SFC) and returns an AST descriptor.
 * 
 * This function uses Vue's SFC parser to extract and parse different sections
 * of a Vue component (template, script, and styles), converting them into
 * their respective AST representations.
 * 
 * @param code - The source code string of the Vue SFC file to parse
 * @returns {VueASTDescriptor} An object containing:
 *   - template: Parsed template AST block with SFCTemplateBlock and RootNode
 *   - script: Parsed script AST block with SFCScriptBlock and BabelParseResult
 *   - styles: Array of style blocks from the component
 *   - meta: Metadata including filename, source code, and CSS variables
 * 
 * @throws Logs errors via logger if parsing fails, but does not throw an exception
 * 
 * @example
 * ```typescript
 * const code = `
 *   <template>
 *     <div>{title}</div>
 *   </template>
 *   <script setup>
 *     import { ref } from 'vue';
 *     const title = ref('Hello')
 *   </script>
 * `;
 * const descriptor = parse(code);
 * ```
 */
export function parse(code: string): VueASTDescriptor {
  const { descriptor, errors } = parseVueSFC(code, {
    filename: compileContext.context.filename,
  });

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
