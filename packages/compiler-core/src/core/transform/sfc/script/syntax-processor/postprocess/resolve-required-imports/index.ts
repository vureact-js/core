import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@transform/shared';
import { replaceVueSuffix } from '../../../shared/replace-vue-suffix';
import { ImportStrategyManager } from './import-strategy-manager';

/**
 * 处理所有必要的运行时 import 注入
 */
export function resolveRequiredImports(ctx: ICompilationContext): TraverseOptions {
  const processedModules = new Set<string>();
  let hasProcessedImports = false;

  // 初始化策略管理器
  const strategyManager = new ImportStrategyManager();

  // 仅 SFC 组件文件需要注入 React.memo，普通脚本文件不应被污染。
  if (ctx.inputType === 'sfc') {
    recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.memo);
  }

  function resolveRequiredImport(path: NodePath<t.ImportDeclaration>) {
    const { node } = path;
    const originalModuleName = node.source.value.toLowerCase();

    // 查找匹配的策略
    const strategy = strategyManager.findStrategy(originalModuleName);

    if (strategy) {
      const result = strategy.process(path, ctx, originalModuleName);

      // 应用策略结果
      if (result.shouldReplaceSource && result.newSource) {
        node.source.value = result.newSource;
      }
    }

    const normalizedModuleName = node.source.value.toLowerCase();

    // 优先合并上下文中待注入的同模块 import。
    mergeImports(node, ctx, normalizedModuleName);

    // 同模块重复 import，保留第一条，移除后续重复项。
    if (processedModules.has(normalizedModuleName) && !path.removed) {
      path.remove();
      return;
    }

    processedModules.add(normalizedModuleName);

    // 首次进入 import 区域时，统一注入上下文里记录的必需依赖。
    if (!hasProcessedImports) {
      const required = createRequiredImports(ctx);

      // 根据策略结果决定如何处理
      if (strategy) {
        const result = strategy.process(path, ctx, originalModuleName);

        if (result.shouldRemove) {
          // 需要移除的包直接被替换为运行时依赖 import 列表。
          path.replaceWithMultiple(required);
        } else if (normalizedModuleName === PACKAGE_NAME.react) {
          // 若已有 react import，则把必需依赖插入其后。
          path.insertAfter(required);
        } else {
          // 其他情况插在当前 import 之前，保持稳定顺序。
          path.insertBefore(required);
        }
      } else {
        // 默认仅注入 react 相关 import
        if (normalizedModuleName === PACKAGE_NAME.react) {
          path.insertAfter(required);
        } else {
          path.insertBefore(required);
        }
      }

      hasProcessedImports = true;
    }

    // 应用移除逻辑
    if (strategy) {
      const result = strategy.process(path, ctx, originalModuleName);
      if (result.shouldRemove && !path.removed) {
        path.remove();
        return;
      }
    }

    // 处理 .vue -> .jsx/.tsx 的后缀替换。
    replaceVueSuffix(ctx, node.source);
  }

  return {
    // 兜底：无 ImportDeclaration 的文件也要能注入必需依赖。
    Program: {
      exit(path) {
        if (hasProcessedImports) return;
        const required = createRequiredImports(ctx);
        path.unshiftContainer('body', required);
        hasProcessedImports = true;
      },
    },

    ImportDeclaration(path) {
      resolveRequiredImport(path);
    },
  };
}

function mergeImports(
  currentNode: t.ImportDeclaration,
  ctx: ICompilationContext,
  moduleName: string,
) {
  const ctxImportItems = ctx.imports.get(moduleName);

  if (!ctxImportItems?.length) {
    return;
  }

  const currentImports = new Set<string>();

  for (const spec of currentNode.specifiers) {
    if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
      currentImports.add(spec.imported.name);
    }

    if (t.isImportDefaultSpecifier(spec) && t.isIdentifier(spec.local)) {
      currentImports.add(spec.local.name);
    }
  }

  for (const item of ctxImportItems) {
    // 已存在同名导入则跳过该项，继续处理后续项。
    if (currentImports.has(item.name)) {
      continue;
    }

    const local = t.identifier(item.name);
    const newNode = !item.onDemand
      ? t.importDefaultSpecifier(local)
      : t.importSpecifier(local, local);

    currentNode.specifiers.push(newNode);
  }

  ctx.imports.delete(moduleName);
}

function createRequiredImports(ctx: ICompilationContext): t.ImportDeclaration[] {
  const result: t.ImportDeclaration[] = [];
  const importMap: Record<
    string,
    (t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier | t.ImportSpecifier)[]
  > = {};

  ctx.imports.forEach((items, moduleName) => {
    const specifier: (t.ImportSpecifier | t.ImportDefaultSpecifier)[] = [];

    for (const item of items) {
      const local = t.identifier(item.name);
      if (!item.onDemand) {
        specifier.push(t.importDefaultSpecifier(local));
      } else {
        specifier.push(t.importSpecifier(local, local));
      }
    }

    importMap[moduleName] = specifier;
  });

  for (const name in importMap) {
    const specifiers = importMap[name]!;
    const importDecl = t.importDeclaration(specifiers, t.stringLiteral(name));

    if (name === PACKAGE_NAME.react) {
      result.unshift(importDecl);
    } else {
      result.push(importDecl);
    }
  }

  return result;
}
