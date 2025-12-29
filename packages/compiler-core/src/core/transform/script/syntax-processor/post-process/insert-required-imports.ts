import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { RuntimeModules } from '@src/consts/runtimeModules';
import { vueDerivedLibraries, vueDerivedPrefixes } from '@src/consts/vueDerivedLibraries';
import { compileContext } from '@src/shared/compile-context';
import { logger } from '@src/shared/logger';

export function insertRequiredImports(): TraverseOptions {
  let inserted = false;

  return {
    ImportDeclaration(path) {
      const { node } = path;
      const required = createRequiredImports();
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

      replaceVueFile(node);
      removeVueRelatedModules(path);
    },
  };
}

type Specifiers = (t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier | t.ImportSpecifier)[];

function createRequiredImports(): t.ImportDeclaration[] {
  const result: t.ImportDeclaration[] = [];
  const { imports } = compileContext.context;
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

function replaceVueFile(node: t.ImportDeclaration) {
  const { source } = node;

  if (!source.value.endsWith('.vue')) return;

  const { lang } = compileContext.context;
  const jsxFile = source.value.replace(/.vue$/, `.${lang.script}x`);

  source.value = jsxFile;
  source.extra = { rawValue: jsxFile, raw: jsxFile };
}

// todo
function removeVueRelatedModules(path: NodePath<t.ImportDeclaration>) {
  const { source } = path.node;
  const { source: sourceCode, filename } = compileContext.context;

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
