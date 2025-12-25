import { parseExpression, ParserOptions, ParserPlugin } from '@babel/parser';
import * as t from '@babel/types';
import { compileContext } from './compile-context';

export type LangType = 'js' | 'jsx' | 'ts' | 'tsx';

type ParseContext = 'script' | 'vueTemplate' | 'expression';

export function getBabelParseOptions(
  lang: LangType = 'js',
  context: ParseContext = 'script',
  filename: string,
): ParserOptions {
  const baseOptions: ParserOptions = {
    sourceType: 'module',
    sourceFilename: filename ?? 'vue-sfc',
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
): t.Expression {
  if (isStringLiteral) {
    return t.stringLiteral(value);
  }

  try {
    const { lang, filename, templateVar } = compileContext.context;
    const expression = parseExpression(value, getBabelParseOptions(lang.script, context, filename));

    if (t.isIdentifier(expression)) {
      // 记录模板使用的所有变量名
      templateVar.ids.add(expression.name);
    }

    return expression;
  } catch {
    // 回退方案：原样输出
    return t.identifier(value);
  }
}
