import { parseExpression, type ParserOptions } from '@babel/parser';
import traverse from '@babel/traverse';
import t from '@babel/types';
import { capitalize } from '@transform/utils';
import { logger } from '@transform/utils/logger';
import { shortHash } from '@utils/random';
import { isNull, isString, isUndefined } from '@utils/types';
import { type ExpressionNode, type SimpleExpressionNode } from '@vue/compiler-core';
import type { StyleInfo } from './types';

// 解析样式部分，提取样式信息
// Parse style section to extract style information
export function parseStyle(
  styleContent: string,
  attributes: Record<string, boolean | string>,
): StyleInfo | null {
  if (!styleContent) return null;

  // 提取 v-bind 表达式中的依赖
  // Extract dependencies from v-bind expressions
  const dependencies = extractStyleDependencies(styleContent);

  return {
    content: styleContent,
    scoped: !!attributes.scoped,
    module: !!attributes.module,
    lang: attributes.lang as string,
    dependencies,
  };
}

// 从样式中提取 v-bind 依赖
// Extract dependencies from v-bind in styles
function extractStyleDependencies(styleContent: string): Set<string> {
  const dependencies = new Set<string>();
  // Match v-bind(color) or v-bind:color, support complex variable names
  const vBindRegex =
    /v-bind(?:\s*:\s*|\()([a-zA-Z_$][\w$]*(?:-[a-zA-Z_$][\w$]*)*)(?:\)|(?=\s|$|;))/g;

  let match;
  while (!isNull((match = vBindRegex.exec(styleContent)))) {
    if (match[1]) {
      dependencies.add(match[1]);
    }
  }
  return dependencies;
}

/**
 * 解析模板 AST，提取顶层依赖
 * Parse template AST to extract top-level dependencies
 */
export function extractDepsAndExpr(
  expressionNode: ExpressionNode | string,
  lang: string = 'js',
): { expression: t.Expression; dependencies: Set<string> } {
  const dependencies = new Set<string>();
  const parseOptions = getParserOptions(lang);

  let content = isString(expressionNode)
    ? expressionNode
    : (expressionNode as SimpleExpressionNode).content;
  let expression: t.Expression = t.identifier(content);

  // 处理 Vue 模板中常见的对象/数组字面量，需要包裹在括号中才能被 Babel 解析
  // Handle object/array literals in Vue template expressions by wrapping them in parentheses for Babel
  const normalizeExpr = (): string => {
    let expressionContent = content;
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      if (!trimmed.includes('=>')) {
        expressionContent = `(${content})`;
      }
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      expressionContent = `(${content})`;
    }
    return expressionContent;
  };

  // 遍历 AST，提取顶层响应式变量
  // Traverse AST to extract top-level reactive variables
  const traverseBabelNode = (ast: t.Node) => {
    const wrapper = t.file(t.program([t.expressionStatement(ast as t.Expression)]));
    traverse(wrapper, {
      Identifier(path) {
        const { node, parent } = path;
        const { name } = node;

        // 跳过静态对象键（Keys of Object Literals)
        // { active: isActive } -> ignore 'active'
        if (t.isObjectProperty(parent) && parent.key === node && !parent.computed) {
          return;
        }
        // 跳过静态成员属性名（Static Member Property Names）
        // obj.key -> ignore 'key'
        if (t.isMemberExpression(parent) && parent.property === node && !parent.computed) {
          return;
        }
        // 跳过顶层函数/类定义名称 (Igrnoe the function/class name)
        if (
          (t.isFunctionDeclaration(parent) && parent.id === node) ||
          (t.isClassDeclaration(parent) && parent.id === node)
        ) {
          return;
        }
        // 跳过导入/导出声明 (Vue 表达式通常不会出现，但作为安全检查)
        // Skip import/export declarations (not normally seen with Vue expressions, but as a safety check)
        if (
          t.isImportSpecifier(parent) ||
          t.isExportSpecifier(parent) ||
          t.isImportDefaultSpecifier(parent)
        ) {
          return;
        }
        dependencies.add(name);
      },
      // 阻止进入函数作用域，只需要捕获闭包变量和顶层依赖
      // Stop traversing into new scopes (function bodies, etc.)
      Function: (path) => path.skip(),
      Class: (path) => path.skip(),
    });
  };

  // 处理 v-for 特殊情况，如 (item, idx) in items
  // Handle v-for special case, e.g., (item, idx) in items
  const handleSpecialVFor = () => {
    const parsed = parseVForExpr(content);
    if (!isNull(parsed)) {
      const sourceAst = parseExpression(parsed.listExpr, parseOptions);
      traverseBabelNode(sourceAst);
    }
  };

  const parseByVarRegex = () => {
    const identifierRegex = /\b([A-Za-z_$][\w$]*)\b/g;

    let m: RegExpExecArray | null;
    while ((m = identifierRegex.exec(content)) !== null) {
      const name = m[1];
      const idx = m.index;
      // 如果前面是点（成员访问），跳过（避免抓到 obj.prop 的 prop）
      if (idx > 0 && content[idx - 1] === '.') continue;
      if (!isUndefined(name)) {
        dependencies.add(name);
      }
    }
  };

  try {
    expression = parseExpression(normalizeExpr(), parseOptions);
    traverseBabelNode(expression);
    handleSpecialVFor();
  } catch (e) {
    // 解析失败回退到正则，提示复杂表达式
    // Fallback to regex on parse failure, warn about complex expression
    parseByVarRegex();
    logger.error(
      expression,
      `Failed to parse expression "${content}". Fallback to regex. Check dependencies manually.\n${String(e)}`,
    );
  }

  return {
    expression,
    dependencies,
  };
}

export const mergeDeps = (
  templateDeps: string[] = [],
  scriptDeps: string[] = [],
  styleDeps: string[] = [],
): string[] => {
  const base = new Set(scriptDeps);
  const final = new Set([...templateDeps, ...scriptDeps, ...styleDeps]);
  final.forEach((dep) => {
    if (isUndefined(dep) || !base.has(dep)) {
      final.delete(dep);
    }
  });
  return [...final];
};

export const getParserOptions = (lang: string, options?: Partial<ParserOptions>): ParserOptions => {
  const plugins: ParserOptions['plugins'] = [
    'objectRestSpread',
    'classProperties',
    'optionalChaining',
    'jsx',
  ];
  if (lang === 'ts' || lang === 'tsx') {
    plugins.push('typescript');
  }
  return {
    sourceType: 'module',
    plugins,
    ...options,
  };
};

// 解析 v-for 表达式，返回 params 列表和 list 表达式字符串
export function parseVForExpr(exp: string): { params: string[]; listExpr: string } | null {
  // 支持 "(item, i) in items" / "item in items" / 支持复杂 listExpr (rest-of-line)
  // Support complex list expressions
  const match = exp.match(/^\s*(\([^)]+\)|[^\s]+)\s+(in|of)\s+([\s\S]+)$/);
  if (isNull(match)) return match;

  const rawParams = match[1]?.trim() || '';
  const listExpr = match[3]?.trim() || '';
  const params = rawParams.startsWith('(')
    ? rawParams
        .slice(1, -1)
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
    : [rawParams];

  return { params, listExpr };
}

export function generateComponentName(name?: string): string {
  if (name?.trim()) {
    return capitalize(name);
  }
  return `Rc${shortHash()}`;
}
