import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@transform/shared';
import { replaceVueSuffix } from '../../shared/replace-vue-suffix';

export function insertRequiredImports(ctx: ICompilationContext): TraverseOptions {
  // 总是确保 React.memo 导入
  recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.memo);

  let inserted = false;

  return {
    // 增加 Program.exit 兜底注入 required imports（处理无 ImportDeclaration 的 SFC）
    Program: {
      exit(path) {
        if (inserted) return;

        const required = createRequiredImports(ctx);
        if (!required.length) return;

        path.unshiftContainer('body', required);
        inserted = true;
      },
    },

    ImportDeclaration(path) {
      const { node } = path;
      const required = createRequiredImports(ctx);
      const module = node.source.value.toLowerCase();
      const isVueLike = module === 'vue' || module === 'vue-router';

      if (!inserted) {
        if (isVueLike) {
          path.replaceWithMultiple(required);
        } else if (module === 'react') {
          path.insertAfter(required);
        } else {
          path.insertBefore(required);
        }

        inserted = true;
      }

      if (isVueLike && !path.removed) {
        path.remove();
        return;
      }

      replaceVueSuffix(ctx, node.source);
    },
  };
}

type Specifiers = (t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier | t.ImportSpecifier)[];

function createRequiredImports(ctx: ICompilationContext): t.ImportDeclaration[] {
  const result: t.ImportDeclaration[] = [];
  const { imports } = ctx;
  const moduleMap = new Map<string, Specifiers>();

  imports.forEach((items, module) => {
    const specifier = items.map((it) => {
      const local = t.identifier(it.name);
      return !it.onDemand ? t.importDefaultSpecifier(local) : t.importSpecifier(local, local);
    });

    moduleMap.set(module, specifier);
  });

  moduleMap.forEach((specifiers, module) => {
    const importDecl = t.importDeclaration(specifiers, t.stringLiteral(module));

    if (module === PACKAGE_NAME.react) {
      result.unshift(importDecl);
    } else {
      result.push(importDecl);
    }
  });

  return result;
}
