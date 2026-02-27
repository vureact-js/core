import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME, VUE_PACKAGES } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@transform/shared';
import { replaceVueSuffix } from '../../shared/replace-vue-suffix';

export function insertRequiredImports(ctx: ICompilationContext): TraverseOptions {
  const processedModules = new Set<string>();
  let hasProcessedImports = false;

  // 总是确保 React.memo 导入
  recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.memo);

  return {
    // 增加 Program.exit 兜底注入 required imports（处理无 ImportDeclaration 的 SFC）
    Program: {
      exit(path) {
        if (hasProcessedImports) return;
        const required = createRequiredImports(ctx);
        // 注入到最顶部
        path.unshiftContainer('body', required);
        hasProcessedImports = true;
      },
    },

    ImportDeclaration(path) {
      const { node } = path;
      const moduleName = node.source.value.toLowerCase();
      const isVueLike = VUE_PACKAGES.some((n) => moduleName.includes(n));

      // 首先尝试合并已存在的 import
      mergeImports(node, ctx);

      // 检查是否已经处理过相同模块的导入
      if (processedModules.has(moduleName) && !path.removed) {
        // 合并到第一个导入声明中，然后移除这个重复的导入
        path.remove();
        return;
      }

      processedModules.add(moduleName);

      // 第一步：只执行一次，确保创建和插入必要的运行时模块
      if (!hasProcessedImports) {
        // 创建从上下文收集到的必要模块节点
        const required = createRequiredImports(ctx);

        if (isVueLike) {
          // 情况1. 在 Vue 原 import 位置进行替换
          path.replaceWithMultiple(required);
        } else if (moduleName === PACKAGE_NAME.react) {
          // 情况2. react 导入已存在，插入其后位置
          path.insertAfter(required);
        } else {
          // 情况3. 直接插入到第一个 import 节点的前面
          path.insertBefore(required);
        }

        hasProcessedImports = true;
      }

      // 第二步：如果还是 Vue 相关包导入则移除
      if (isVueLike && !path.removed) {
        path.remove();
        return;
      }

      // 第三步：如果是文件导入，替换 .vue 文件后缀名为 .jsx/.tsx
      replaceVueSuffix(ctx, node.source);
    },
  };
}

function mergeImports(currentNode: t.ImportDeclaration, ctx: ICompilationContext) {
  const moduleName = currentNode.source.value.toLowerCase();
  const ctxImportItems = ctx.imports.get(moduleName);

  if (!ctxImportItems?.length) {
    return;
  }

  // 收集当前 import 节点声明的导入项名称
  const currentImports = new Set<string>();

  for (const spec of currentNode.specifiers) {
    if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
      currentImports.add(spec.imported.name);
    }
    if (t.isImportDefaultSpecifier(spec) && t.isIdentifier(spec.local)) {
      currentImports.add(spec.local.name);
    }
  }

  // 合并两个相同的 import
  for (const item of ctxImportItems) {
    // 如果当前已有的 import 声明不存在该节点，则新增
    if (currentImports.has(item.name)) return;

    const local = t.identifier(item.name);
    const newNode = !item.onDemand
      ? t.importDefaultSpecifier(local)
      : t.importSpecifier(local, local);

    currentNode.specifiers.push(newNode);
  }

  // 删除上下文中的整个重复 import
  ctx.imports.delete(moduleName);
}

type Specifiers = (t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier | t.ImportSpecifier)[];

function createRequiredImports(ctx: ICompilationContext): t.ImportDeclaration[] {
  const result: t.ImportDeclaration[] = [];
  const importMap: Record<string, Specifiers> = {};

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
