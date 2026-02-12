import { types as t } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { ICompilationContext } from '@compiler/context/types';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { recordImport } from '@src/core/transform/shared/record-import';
import { logger } from '@src/shared/logger';
import { capitalize } from '@src/utils/capitalize';
import { setNodeExtensionMeta } from '../../shared/babel-utils';
import { createCallExpProcessor } from '../../shared/processor-factory';
import { CallExpArgs, ReactiveTypes } from '../../shared/types';

export function processReactiveApi(ctx: ICompilationContext): TraverseOptions {
  const adaptApis = {
    ref: VuR_Runtime.useState$,
    toRef: VuR_Runtime.useState$,
    toRefs: VuR_Runtime.useState$,
    reactive: VuR_Runtime.useState$,
    shallowRef: VuR_Runtime.useShallowState,
    shallowReactive: VuR_Runtime.useShallowState,
  } as const;

  return {
    CallExpression(path) {
      const { callee } = path.node;

      createCallExpProcessor(ctx, path, {
        adaptApis,
        warnWithoutDeclaration: true,

        handleVariableDeclarator(decl) {
          const { id } = decl;

          if (!t.isIdentifier(callee) || !t.isIdentifier(id)) return;

          const getterName = id.name;
          const setterName = `set${capitalize(id.name)}`;
          const newId = t.arrayPattern([t.identifier(getterName), t.identifier(setterName)]);

          decl.id = newId;

          setNodeExtensionMeta(decl, {
            isReactive: true,
            reactiveType: callee.name as ReactiveTypes,
            getterName,
            setterName,
          });
        },

        onProcessed(adaptName) {
          if (t.isIdentifier(callee) && callee.name === 'toRef') {
            normalizeToRefArgs(ctx, path.node.arguments);
          }

          recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, adaptName);
        },
      });
    },
  };
}

function normalizeToRefArgs(ctx: ICompilationContext, args: CallExpArgs) {
  const [obj, key] = args;

  if (!key) return;

  if (!t.isIdentifier(obj)) {
    const { scriptData, filename } = ctx;

    logger.error(`Expected an object variable identifier.`, {
      source: scriptData.source,
      file: filename,
      loc: obj!.loc!,
    });

    return;
  }

  const keyId = t.isStringLiteral(key)
    ? t.identifier(key.value)
    : t.isIdentifier(key)
      ? key
      : t.identifier(String(key));

  args.length = 0;
  args.push(t.memberExpression(obj, keyId));
}
