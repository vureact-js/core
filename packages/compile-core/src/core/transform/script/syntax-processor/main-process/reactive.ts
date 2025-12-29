import { types as t } from '@babel/core';
import { TraverseOptions } from '@babel/traverse';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { compileContext } from '@src/shared/compile-context';
import { logger } from '@src/shared/logger';
import { recordImport } from '@src/shared/runtime-utils';
import { capitalize } from '@src/utils/capitalize';
import { setNodeExtensionMeta } from '../../shared/babel-utils';
import { CallExpArgs, ReactiveTypes } from '../../shared/types';
import { createCallExpProcessor } from './processor-factory';

export function processReactiveApi(): TraverseOptions {
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

      createCallExpProcessor(path, {
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
            normalizeToRefArgs(path.node.arguments);
          }

          recordImport(RuntimeModules.VUREACT_RUNTIME, adaptName, true);
        },
      });
    },
  };
}

function normalizeToRefArgs(args: CallExpArgs) {
  const [obj, key] = args;

  if (!key) return;

  if (!t.isIdentifier(obj)) {
    const { source, filename } = compileContext.context;
    logger.error(`Expected an object variable identifier.`, {
      source,
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
