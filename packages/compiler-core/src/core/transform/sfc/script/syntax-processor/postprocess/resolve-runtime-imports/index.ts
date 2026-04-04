import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@transform/shared';
import { replaceVueSuffix } from '../../../shared/replace-vue-suffix';
import { ImportStrategyManager } from './import-strategy-manager';

/**
 * 处理运行时导入注入
 */
export function resolveRuntimeImports(ctx: ICompilationContext): TraverseOptions {
  // 仅 SFC 组件文件需要注入 React.memo，普通脚本文件不应被污染。
  if (ctx.inputType === 'sfc') {
    recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.memo);
  }

  // 初始化策略管理器
  const strategyManager = new ImportStrategyManager();

  // 记录已处理过的 import 模块，防止重复注入
  const processedModules = new Set<string>();

  // 记录是否已完成运行时 import 注入
  let hasImports = false;

  return {
    ImportDeclaration(path) {
      const { node } = path;
      const originalModuleName = node.source.value.toLowerCase();

      // 查找匹配的策略
      const strategy = strategyManager.findStrategy(originalModuleName);

      let strategyResult = null;

      if (strategy) {
        strategyResult = strategy.process(path, ctx, originalModuleName);

        // 应用策略结果
        if (strategyResult.shouldReplaceSource && strategyResult.newSource) {
          node.source.value = strategyResult.newSource;
        }

        // 应用移除逻辑
        if (strategyResult.shouldRemove && !path.removed) {
          path.remove();
          return;
        }
      }

      // 处理 .vue -> .jsx/.tsx 的后缀替换。
      replaceVueSuffix(node.source);

      // 以替换/规范化后的模块名作为后续处理的 key，避免像 'vue-router' -> '@vureact/router'
      // 这类被替换的模块导致重复注入/合并失效的问题
      const finalModuleName = node.source.value.toLowerCase();

      // 同模块重复 import，保留第一条，移除后续重复项。
      if (processedModules.has(finalModuleName) && !path.removed) {
        path.remove();
        return;
      }

      processedModules.add(finalModuleName);

      // 优先合并上下文中待注入的同模块 import（使用替换后的模块名）
      mergeImports(node, ctx, finalModuleName);

      // 首次进入 import 区域时，统一注入上下文里记录的必需依赖。
      if (!hasImports) {
        const importNodes = createImportNodes(ctx);

        if (importNodes.length) {
          // 根据策略结果决定如何处理
          if (strategyResult?.shouldInjectRuntimeImports) {
            // 需要注入运行时依赖的包，把必需依赖插入其后
            path.insertAfter(importNodes);
          } else if (finalModuleName === PACKAGE_NAME.react) {
            // 若已有 react import，则把必需依赖插入其后
            path.insertAfter(importNodes);
          } else {
            // 首个 import 注入节点继承当前 import 节点的顶部注释
            forkLeadingComments(importNodes[0]!, node);

            // 其他情况，在第一个 import 之前注入，
            path.insertBefore(importNodes);
          }
        }

        hasImports = true;
      }
    },

    // 兜底：无 ImportDeclaration 的文件也要能注入必需依赖。
    Program: {
      exit(path) {
        if (hasImports) return;
        hasImports = true;

        const { node } = path;
        const importNodes = createImportNodes(ctx);

        if (!importNodes.length) return;

        // 首个 import 注入节点继承当前的顶部注释
        forkLeadingComments(importNodes[0]!, node);

        // 注入文件顶部
        path.unshiftContainer('body', importNodes);
      },
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

  // 收集当前导入声明中已存在的导入标识符名称
  const currentImports = new Set<string>();

  // 遍历当前导入声明的所有说明符
  for (const spec of currentNode.specifiers) {
    // 处理具名导入（import { xxx }）
    if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
      currentImports.add(spec.imported.name);
    }

    // 处理默认导入（import xxx）
    if (t.isImportDefaultSpecifier(spec) && t.isIdentifier(spec.local)) {
      currentImports.add(spec.local.name);
    }
  }

  // 遍历上下文中待注入的同模块导入项
  for (const item of ctxImportItems) {
    // 已存在同名导入则跳过该项，继续处理后续项。
    if (currentImports.has(item.name)) {
      continue;
    }

    // 根据导入类型创建对应的导入说明符节点
    const local = t.identifier(item.name);

    const newNode = !item.onDemand
      ? t.importDefaultSpecifier(local) // 默认导入
      : t.importSpecifier(local, local); // 具名导入

    // 将新创建的导入说明符添加到当前导入声明中
    currentNode.specifiers.push(newNode);
  }

  // 合并完成后从上下文中清除该模块的导入记录，避免重复注入
  ctx.imports.delete(moduleName);
}

function createImportNodes(ctx: ICompilationContext): t.ImportDeclaration[] {
  const result: t.ImportDeclaration[] = [];

  // 将上下文中的导入记录转换为 ImportDeclaration 节点数组
  const importDeclarations = Array.from(ctx.imports).map(([moduleName, items]) => {
    // 为每个导入项创建对应的导入说明符
    const specifiers = items.map((item) => {
      const local = t.identifier(item.name);

      // 按需导入使用 importSpecifier，默认导入使用 importDefaultSpecifier
      return item.onDemand ? t.importSpecifier(local, local) : t.importDefaultSpecifier(local);
    });

    // 创建完整的导入声明节点
    return t.importDeclaration(specifiers, t.stringLiteral(moduleName));
  });

  // 对生成的导入声明进行排序：React 相关导入置顶，其他导入保持原顺序
  for (const decl of importDeclarations) {
    const name = (decl.source as t.StringLiteral).value;
    if (name === PACKAGE_NAME.react) {
      // React 包导入放在结果数组开头
      result.unshift(decl);
    } else {
      // 其他包导入放在结果数组末尾
      result.push(decl);
    }
  }

  return result;
}

function forkLeadingComments(target: t.Node, source: t.Node) {
  const { leadingComments } = source;

  if (!leadingComments?.length) {
    return;
  }

  const newComments = [...leadingComments];

  // 清除原节点的注释，避免重复输出
  source.leadingComments = null;
  target.leadingComments = newComments;
}
