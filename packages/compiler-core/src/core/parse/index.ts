import { ParseResult as BabelParseResult } from '@babel/parser';
import { ICompilationContext } from '@compiler/context/types';
import { LangType } from '@shared/babel-utils';
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

export interface VueASTDescriptor {
  template: Block<SFCTemplateBlock, RootNode>;
  script: Block<SFCScriptBlock, BabelParseResult>;
  styles: SFCStyleBlock[];
}

type Block<S, T> = {
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
 * @param source - The source code string of the Vue SFC file to parse
 * @param {ParserOptions} options - Parser Options
 *
 * @returns {VueASTDescriptor} An object containing:
 *   - template: Parsed template AST block with SFCTemplateBlock and RootNode
 *   - script: Parsed script AST block with SFCScriptBlock and BabelParseResult
 *   - styles: Array of style blocks from the component
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
export function parse(source: string, ctx: ICompilationContext): VueASTDescriptor {
  const { descriptor, errors } = parseVueSFC(source, {
    filename: ctx.filename,
  });

  const result: VueASTDescriptor = {
    template: parseTemplate(descriptor.template),
    script: parseScript(descriptor.scriptSetup || descriptor.script, ctx.filename),
    styles: descriptor.styles,
  };

  // 初始化编译上下文

  ctx.cssVars = descriptor.cssVars;
  ctx.scriptData.lang = (result.script?.source?.lang as LangType) || 'js';

  // 收集错误日志
  if (errors.length) {
    errors.forEach((err) => {
      logger.error(err.message, {
        source: descriptor.source,
        file: descriptor.filename,
        loc: (err as CompilerError).loc,
      });
    });
  }

  return result;
}
