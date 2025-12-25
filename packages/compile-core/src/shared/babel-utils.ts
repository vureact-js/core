import { parseExpression, ParserOptions, ParserPlugin } from '@babel/parser';
import { Expression, identifier, stringLiteral } from '@babel/types';
import { compileContext } from './compile-context';

export type LangType = 'js' | 'jsx' | 'ts' | 'tsx';

type ParseContext = 'script' | 'vueTemplate' | 'expression';

export function getBabelParseOptions(
  lang: LangType = 'js',
  context: ParseContext = 'script',
  filename = 'vue-sfc',
): ParserOptions {
  const baseOptions: ParserOptions = {
    sourceType: 'module',
    sourceFilename: filename,
    errorRecovery: true, // 容错模式
  };

  const plugins: ParserPlugin[] = [];

  // 1. 根据语言添加插件
  if (lang.includes('ts')) {
    plugins.push('typescript');
  }

  // jsx tsx
  if (lang.endsWith('sx')) {
    if (lang.startsWith('t')) plugins.push('typescript');
    plugins.push('jsx');
  }

  // 2. 根据使用场景调整
  if (context === 'vueTemplate') {
    // 模板中可能需要特殊插件
    plugins.push('decorators-legacy'); // 如果有装饰器
  } else if (context === 'expression') {
    // 表达式解析：更严格，禁止某些语法
    baseOptions.sourceType = 'script'; // 表达式不需要模块
    baseOptions.allowReturnOutsideFunction = true;
    baseOptions.allowSuperOutsideMethod = true;
  }

  // 3. 通用插件
  plugins.push('classProperties', 'objectRestSpread', 'asyncGenerators');

  return {
    ...baseOptions,
    plugins: [...new Set(plugins)],
  };
}

/**
 * 解析 Vue 模板的各种 js 片段表达式
 * @param value js 字符串表达式，由 Vue 解析后得到
 * @param isStringLiteral 是否纯文本
 * @param context babel 解析方式
 * @returns {Expression}
 */
export function parseTemplateExp(
  value: string,
  isStringLiteral = false,
  context: ParseContext = 'vueTemplate',
): Expression {
  if (isStringLiteral) {
    return stringLiteral(value);
  }

  try {
    const { lang, filename } = compileContext.context;

    const expression = parseExpression(value, getBabelParseOptions(lang.script, context, filename));

    return expression;
  } catch {
    // 回退方案：利用 identifier 的代码还原输出
    return identifier(value);
  }
}
