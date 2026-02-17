import { parseExpression, ParserOptions, ParserPlugin } from '@babel/parser';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export type LangType = 'js' | 'jsx' | 'ts' | 'tsx';

export type ParseContext = 'script' | 'vueTemplate' | 'expression';

export function getBabelParseOptions(
  lang: LangType = 'js',
  context: ParseContext = 'script',
  filename?: string,
): ParserOptions {
  const baseOptions: ParserOptions = {
    sourceType: 'module',
    sourceFilename: filename ?? 'anonymous',
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

export function stringToExpr(input: string, lang?: LangType, filename = ''): t.Expression {
  return parseExpression(input, getBabelParseOptions(lang, 'expression', filename));
}

/**
 * 判断当前路径是否处于组件函数或自定义 Hook 的顶层作用域
 * @param path 当前函数的路径
 * @param rootScope 组件的主体(即 `<script setup>` 的等价物 ast.program)
 * @param inScriptFile 是否在 script 文件中（更加严格的判断）
 */
export function atComponentOrHookRoot(
  path: NodePath<t.Node>,
  rootScope: t.Node,
  inScriptFile = false,
): boolean {
  const { parentPath, scope } = path;

  // 获取当前函数的父级作用域对应的 Block
  const parentBlock = scope.block;

  // 在组件文件内且没有父级，说明已是最顶层
  if (!parentPath) return !inScriptFile;

  // 核心判断：父亲必须是组件的主体
  // 如果父级块就是组件的根块，说明这是顶层函数
  if (parentBlock === rootScope) {
    // 如果是在 script 文件中，且 hook 作用域是在最顶层，则不合规
    if (inScriptFile) return false;

    // 还需要排除一种情况：是否被包裹在 if/for 等非函数块中？
    // 虽然作用域链上父级是组件，但在 AST 树上，它可能被 BlockStatement 包裹
    // 例如： if (true) { const fn = () => {} } -> 这不是顶层
    if (parentPath.isBlockStatement() && parentPath.node !== rootScope) {
      return false;
    }
    // 还有一种情况，作为参数传递的函数，例如 useEffect(() => { ... })
    // 这种函数的 parent 是 CallExpression，所以在回调函数里不能使用 hook
    if (parentPath.isCallExpression() || parentPath.isNewExpression()) {
      return false;
    }

    return true;
  }

  return false;
}
