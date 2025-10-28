import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { THIRD_PARTY, USE_IMMER } from '@constants/react';
import { isBool, isUndefined } from '@utils/types';
import type { ScriptTransformContext } from './types';
import { createImports } from './utils';

export function processImports(ast: t.File, ctx: ScriptTransformContext) {
  const { neededImports } = ctx;
  const result: t.ImportDeclaration[] = [];

  // First pass: Remove Vue imports
  traverse(ast, {
    ImportDeclaration(path) {
      if (isVueImport(path.node)) {
        path.remove();
      }
    },
  });

  // Second pass: Generate on-demand imports (group React and third-party)
  Object.keys(neededImports).forEach(pkgName => {
    // @ts-ignore
    const imports = neededImports[pkgName];
    if (imports?.size) {
      result.push(createImports([...imports], pkgName));
    }
    if (isBool(imports) && pkgName === THIRD_PARTY.useImmer) {
      result.push(createImports([USE_IMMER], pkgName));
    }
  });

  for (let i = result.length - 1; i >= 0; i--) {
    const imp = result[i];
    if (!isUndefined(imp)) ast.program.body.unshift(imp);
  }
}

function isVueImport(node: t.ImportDeclaration): boolean {
  return !!node.source?.value && String(node.source.value).includes('vue');
}
