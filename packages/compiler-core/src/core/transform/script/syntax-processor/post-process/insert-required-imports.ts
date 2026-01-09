import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules } from '@src/consts/runtimeModules';
import { vueDerivedLibraries, vueDerivedPrefixes } from '@src/consts/vueDerivedLibraries';
import { logger } from '@src/shared/logger';
import { replaceVueSuffix } from '../../shared/replace-vue-suffix';

export function insertRequiredImports(ctx: ICompilationContext): TraverseOptions {
  let inserted = false;

  return {
    ImportDeclaration(path) {
      const { node } = path;
      const required = createRequiredImports(ctx);
      const module = node.source.value.toLowerCase();
      const isVue = module === 'vue';

      if (!inserted) {
        inserted = true;

        if (isVue) {
          path.replaceInline(required);
          return;
        }

        path.insertBefore(required);
      }

      if (isVue && !path.removed) {
        path.remove();
        return;
      }

      replaceVueSuffix(ctx, node.source);
      removeVueRelatedModules(ctx, path);
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

    if (module === RuntimeModules.REACT) {
      result.unshift(importDecl);
    } else {
      result.push(importDecl);
    }
  });

  return result;
}

// todo
function removeVueRelatedModules(ctx: ICompilationContext, path: NodePath<t.ImportDeclaration>) {
  const { source } = path.node;
  const { source: sourceCode, filename } = ctx;

  if (!isBlacklistedVueImport(source.value)) return;

  logger.warn(
    'This package is an internal or derived Vue module that are incompatible with React, ' +
      'the compiled output will not run correctly, ' +
      'and you need to manually find and apply appropriate alternatives to handle them.',
    {
      source: sourceCode,
      file: filename,
      loc: source.loc!,
    },
  );

  path.addComment('leading', '!Incompatible: please manually replace.', true);
}

function isBlacklistedVueImport(source: string): boolean {
  return (
    vueDerivedLibraries.includes(source) ||
    vueDerivedPrefixes.some((prefix) => source.startsWith(prefix))
  );
}
