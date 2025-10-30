import { parse as babelParse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { VUE_REACTIVE_APIS } from '@constants/vue';
import { isNull, isUndefined } from '@utils/types';
import type { ExtendedVariableDeclarator, ScriptInfo } from './types';
import { getParserOptions } from './utils';

/**
 * 解析脚本，生成 Babel AST 并标记响应式。
 * Parse script to generate Babel AST with reactive marking.
 */
export function parseScript(
  scriptContent?: string,
  lang = 'js',
  nonReactivies?: Set<string>,
): ScriptInfo['file'] | null {
  if (!scriptContent) return null;
  const ast = babelParse(scriptContent, getParserOptions(lang));
  markReactiveCalls(ast, nonReactivies);
  return ast;
}

function markReactiveCalls(
  ast: ScriptInfo['file'],
  nonReactivies: Set<string> = new Set(),
): ScriptInfo['file'] {
  traverse(ast, {
    // 仅在 Program 顶层寻找 VariableDeclarator，以处理顶层声明（<script setup>）
    // VariableDeclarator is only looked for at the top level of Program to process top-level declarations (<script setup>)
    Program: {
      enter(path) {
        path.node.body.forEach((node) => {
          if (t.isVariableDeclaration(node)) {
            node.declarations.forEach((decl) => {
              identifyReactiveDeclarations(
                decl,
                node as unknown as ExtendedVariableDeclarator,
                nonReactivies,
              );
            });
          }
        });
        // 顶层遍历完成后停止，避免进入函数体内部，只关注顶层声明
        // Avoid entering function bodies and focus only on top-level declarations
        path.stop();
      },
    },
  });
  return ast;
}

/**
 * 识别 ref/reactive/watch/computed 声明并标记。
 * Identify ref/reactive/watch/computed declarations and mark them.
 */
function identifyReactiveDeclarations(
  node: t.Node,
  parentDecl: ExtendedVariableDeclarator,
  nonReactivies: Set<string>,
): ExtendedVariableDeclarator | null {
  if (!t.isVariableDeclarator(node)) {
    return null;
  }

  const { init } = node;
  if (!init) {
    return null;
  }

  // 检查是否为函数调用，如 const count = ref(0)
  // Check if it is a function call, such as const count = ref(0)
  if (t.isCallExpression(init)) {
    const { callee } = init;
    let reactiveType: string | null = null;

    // 检查 callee 是否为 Identifier (如 ref, reactive)
    // Check if callee is an Identifier (e.g. ref, reactive)
    if (t.isIdentifier(callee)) {
      const { name } = callee;
      if (name in VUE_REACTIVE_APIS) {
        reactiveType = name;
      }
    }
    // 检查 callee 是否为 MemberExpression (如 Vue.ref)
    // Check if callee is a MemberExpression (like Vue.ref)
    else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
      const {
        property: { name },
      } = callee;
      if (name in VUE_REACTIVE_APIS) {
        reactiveType = name;
      }
    }

    if (!isNull(reactiveType)) {
      const variableName = t.isIdentifier(node.id) ? node.id.name : '';
      const extendedNode = node as ExtendedVariableDeclarator;

      extendedNode.isReactive = true;
      extendedNode.reactiveType = reactiveType;

      // Check for non-reactive ref scenarios
      if (reactiveType === VUE_REACTIVE_APIS.ref) {
        const c = '@non-reactive';
        const hasNonReactiveComment =
          node.leadingComments?.some((ct) => ct.value.includes(c)) ||
          parentDecl?.leadingComments?.some((ct) => ct.value.includes(c));
        if (hasNonReactiveComment || nonReactivies?.has(variableName)) {
          extendedNode.isReactive = false;
        }
      }
    }
  }

  return null;
}

/**
 * 提取脚本中的顶层响应式变量 (ref/reactive/computed)
 * Extract top-level reactive variables in scripts
 */
export function extractScriptDependencies(ast?: ScriptInfo['file']): Set<string> {
  const dependencies = new Set<string>();

  if (isUndefined(ast?.program)) {
    return dependencies;
  }

  const collectDeps = (declarator: t.VariableDeclarator) => {
    const extendedDeclarator = declarator as ExtendedVariableDeclarator;
    const obj = t.getBindingIdentifiers(declarator.id);
    // 检查是否被 identifyReactiveDeclarations 标记
    if (extendedDeclarator.reactiveType) {
      Object.values(obj).forEach((identifier) => {
        // 提取所有声明的变量名，包括解构 (e.g., const { state } = reactive({}))
        dependencies.add(identifier.name);
      });
    }
  };

  // 只遍历顶层 Program body
  // Only traverse the top-level Program body
  ast.program.body.forEach((node) => {
    // 遍历顶层 VariableDeclaration 和 ExportNamedDeclaration
    if (t.isVariableDeclaration(node)) {
      node.declarations.forEach(collectDeps);
    } else if (t.isExportNamedDeclaration(node) && t.isVariableDeclaration(node.declaration)) {
      // 导出变量声明 (export const count = ref(0))
      node.declaration.declarations.forEach(collectDeps);
    }
  });

  return dependencies;
}
