import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { TransformedImportInfo } from '@transform/types';
import { isUndefined } from '@utils/types';
import { createImports } from './utils';

export function processImports(ast: t.File, imports: TransformedImportInfo) {
  const all: t.ImportDeclaration[] = [];

  // First pass: Remove Vue imports
  traverse(ast, {
    ImportDeclaration(path) {
      if (isVueImport(path.node)) {
        path.remove();
      }
    },
  });

  // Second pass: Generate on-demand imports (group React and third-party)
  Object.keys(imports).forEach((pkgName) => {
    // @ts-ignore
    const moduleList = imports[pkgName] as Set<string>;
    if (moduleList.size) {
      all.push(createImports([...moduleList], pkgName));
    }
  });

  for (let i = all.length - 1; i >= 0; i--) {
    const _import = all[i];
    if (!isUndefined(_import)) ast.program.body.unshift(_import);
  }
}

function isVueImport(node: t.ImportDeclaration): boolean {
  return !!node.source?.value && String(node.source.value).includes('vue');
}
