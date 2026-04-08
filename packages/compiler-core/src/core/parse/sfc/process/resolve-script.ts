import { parse as babelParse } from '@babel/parser';
import { ICompilationContext } from '@compiler/context/types';
import { getBabelParseOptions, LangType } from '@shared/babel-utils';
import { logger } from '@shared/logger';
import { SFCDescriptor, SFCScriptBlock } from '@vue/compiler-sfc';
import { ParseResult } from '..';

export function resolveScript(
  descriptor: SFCDescriptor,
  ctx: ICompilationContext,
  parseResult: ParseResult,
) {
  // 不支持传统 script！！！
  // 我们不是"万能转换器"
  // 我们是"现代 Vue → React 专业转换器"
  // 专注于一件事，做到最好
  if (descriptor.script) {
    throw new Error(
      `Traditional Vue <script> syntax is not supported. Please migrate to <script setup>. \n    at <anonymous> (${ctx.filename})`,
    );
  }

  const { scriptSetup } = descriptor;

  if (!scriptSetup) return null;

  // 收集 Vue 的 script 警告
  if (scriptSetup?.warnings) {
    scriptSetup?.warnings.forEach((msg) => {
      logger.warn(msg, { file: ctx.filename });
    });
  }

  resolveContext(scriptSetup, ctx);

  const parseOpts = getBabelParseOptions(scriptSetup.lang as 'js', 'script', ctx.filename);

  parseResult.script = {
    ast: babelParse(scriptSetup.content, parseOpts),
    source: scriptSetup,
  };
}

function resolveContext(scriptSetup: SFCScriptBlock, ctx: ICompilationContext) {
  let { content, lang } = scriptSetup;

  const resolveVRComment = (source: string): string => {
    // 从注释 @vr-name: xxx 中提取组件名
    const regx = /\/\/\s*@vr-name:\s*(\w+)/;
    const nameMatch = source.match(regx);

    // 移除注释
    content = content.replace(regx, '');

    return nameMatch?.[1]?.trim() || '';
  };

  ctx.compName = resolveVRComment(content);
  ctx.scriptData.source = content;
  ctx.scriptData.lang = (lang as LangType) || 'js';

  // 更新源码
  scriptSetup.content = content;
}
