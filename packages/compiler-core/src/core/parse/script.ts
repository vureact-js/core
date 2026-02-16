import { generate } from '@babel/generator';
import { parse as babelParse, ParseResult as BabelParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { getBabelParseOptions, LangType } from '@shared/babel-utils';
import { logger } from '@shared/logger';
import { SFCScriptBlock } from '@vue/compiler-sfc';
import { ParseResult } from '.';

export function parseScriptBlock(
  script: SFCScriptBlock | null,
  scriptSetup: SFCScriptBlock | null,
  ctx: ICompilationContext,
): ParseResult['script'] {
  // 优先使用 <script setup>
  const scriptBlock = scriptSetup || script;

  if (!scriptBlock) return null;

  const result: ParseResult['script'] = {
    source: scriptBlock,
    ast: {} as BabelParseResult,
  };

  const options = getBabelParseOptions(scriptBlock.lang as 'js', 'script', ctx.filename);

  // 处理传统 script
  if (script) {
    const { code, ast, name } = extractSetupBodyToTopLevel(scriptBlock.content, options);

    if (ast) {
      result.source!.content = code;
      result.ast = ast;
      ctx.compName = name;
    }

    logger.warn(
      'Using traditional script (instead of <script setup>) may result in unstable or non-functional React code. It is recommended to use <script setup> instead.',
      { file: ctx.filename },
    );
  } else {
    // 处理 scriptSetup
    result.ast = babelParse(result.source!.content, options);
  }

  // 收集 Vue 的 script 警告
  if (scriptBlock?.warnings) {
    scriptBlock?.warnings.forEach((msg) => {
      logger.warn(msg, { file: ctx.filename });
    });
  }

  const source = scriptBlock.content;

  ctx.scriptData.source = source;
  ctx.compName = extractCompName(source);
  ctx.scriptData.lang = (scriptBlock.lang as LangType) || 'js';

  return result;
}

function extractSetupBodyToTopLevel(
  content: string,
  options: any,
): { code: string; name: string; ast?: BabelParseResult } {
  let name = '';

  try {
    const ast: BabelParseResult = babelParse(content, options);

    const importNodes: t.Node[] = [];
    const otherTopLevel: t.Node[] = [];

    let setupStatements: t.Node[] = [];

    for (const node of ast.program.body) {
      if (t.isImportDeclaration(node)) {
        importNodes.push(node);
        continue;
      }

      // 处理 export default {...}
      if (t.isExportDefaultDeclaration(node)) {
        const decl = node.declaration;

        if (decl && t.isObjectExpression(decl)) {
          // 获取 name 选项
          const nameProp = decl.properties.find((p) => {
            if (t.isObjectProperty(p)) {
              const key = p.key;
              return (
                (t.isIdentifier(key) && key.name === 'name') ||
                (t.isStringLiteral(key) && key.value === 'name')
              );
            }
            return false;
          });

          if (nameProp && t.isObjectProperty(nameProp)) {
            if (t.isStringLiteral(nameProp.value)) {
              name = nameProp.value.value;
            }
          }

          // 获取 setup 选项
          const setupProp = decl.properties.find((p: any) => {
            if (t.isObjectMethod(p)) {
              return p.key && (p.key as t.Identifier).name === 'setup';
            }

            if (t.isObjectProperty(p)) {
              const key = p.key;
              return (
                (t.isIdentifier(key) && key.name === 'setup') ||
                (t.isStringLiteral(key) && key.value === 'setup')
              );
            }

            return false;
          });

          // 提取 setup 内的所有语句，但不包含最后的 return
          if (setupProp) {
            const value = t.isObjectMethod(setupProp)
              ? setupProp
              : t.isObjectProperty(setupProp)
                ? setupProp.value
                : null;

            if (value && (t.isFunction(value) || t.isObjectMethod(value))) {
              const fnBody = t.isBlockStatement(value.body) ? value.body.body : [];

              for (const stmt of fnBody) {
                if (t.isReturnStatement(stmt)) continue;
                setupStatements.push(stmt);
              }
            }
          }
        }

        // skip adding export default to otherTopLevel (we're removing it)
        continue;
      }

      // keep other top-level nodes (e.g., additional exports, consts)
      otherTopLevel.push(node);
    }

    const parts: string[] = [];
    const stmts = importNodes.concat(otherTopLevel, setupStatements);

    for (const n of stmts) {
      parts.push(generate(n).code);
    }

    return { name, ast, code: parts.join('\n\n') };
  } catch (e) {
    // 如果解析失败则回退到原始内容
    console.error(e);
    return { name, code: content };
  }
}

function extractCompName(source: string): string {
  // 匹配最顶部的注释
  const nameMatch = source.match(/@vr-name:\s*(\w+)/);
  return nameMatch?.[1]?.trim() || '';
}
