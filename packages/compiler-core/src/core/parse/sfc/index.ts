import { ParseResult as BabelParseResult } from '@babel/parser';
import { ICompilationContext } from '@compiler/context/types';
import { logger } from '@shared/logger';
import { executePlugins } from '@shared/plugin-executor';
import { PluginRegister } from '@src/compiler';
import { CompilerError, RootNode } from '@vue/compiler-core';
import {
  parse as parseVueSFC,
  SFCDescriptor,
  SFCScriptBlock,
  SFCStyleBlock,
  SFCTemplateBlock,
} from '@vue/compiler-sfc';
import { processVueSyntax } from './process';

export interface ParseResult {
  template: BlockIR<SFCTemplateBlock, RootNode>;
  script: BlockIR<SFCScriptBlock, BabelParseResult>;
  style: BlockIR<SFCStyleBlock, undefined>;
}

type BlockIR<S, T> = {
  source?: S;
  ast: T;
} | null;

export interface ParserOptions {
  plugins?: PluginRegister<ParseResult>;
}

/**
 * 解析 Vue 单文件组件（SFC）源码，生成结构化解析结果。
 *
 * 此函数是解析阶段的核心入口，
 * 负责将 Vue SFC 源码解析为包含模板、脚本、样式等各个块的结构化数据。
 *
 * @param source - Vue 单文件组件的源码字符串
 * @param ctx - 编译上下文对象
 * @param plugins - 可选的插件注册表，用于对解析结果进行自定义处理和增强
 *
 * @returns 解析结果对象，包含模板、脚本、样式块的解析信息
 * @throws 不会直接抛出异常，错误信息会通过日志系统记录
 */
export function parseSFC(
  source: string,
  ctx: ICompilationContext,
  options?: ParserOptions,
): ParseResult {
  const { descriptor, errors } = parseVueSFC(source, {
    filename: ctx.filename,
  });

  const result: ParseResult = {
    template: null,
    script: null,
    style: null,
  };

  collectErrs(descriptor, errors);
  processVueSyntax(descriptor, ctx, result);
  executePlugins(options?.plugins, result, ctx);

  return result;
}

function collectErrs(descriptor: SFCDescriptor, errors: (SyntaxError | CompilerError)[]) {
  for (const err of errors) {
    logger.error(err.message, {
      source: descriptor.source,
      file: descriptor.filename,
      loc: (err as CompilerError)?.loc,
    });
  }

  if (descriptor.cssVars.length) {
    logger.error('Unable to process CSS variables in the style block', {
      file: descriptor.filename,
    });
  }
}
