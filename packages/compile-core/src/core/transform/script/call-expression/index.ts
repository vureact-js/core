import { traverse } from '@babel/core';
import { ScriptBlockIR } from '..';
import { transformUndeclaredComputedCall } from '../variable-declarator/computed';
import { transformUndeclaredReactiveCall } from '../variable-declarator/reactive';
import { transformUndeclaredReadonlyCall } from '../variable-declarator/readonly';
import { transformUndeclaredToRefCall } from '../variable-declarator/toRef';
import { transformLifecycle } from './lifecycle';
import { transformNextTick } from './nextTick';
import { transformWatch } from './watch';
import { tranformWatchEffect } from './watchEffect';

export function handleVueApiCallExp(ast: ScriptBlockIR) {
  traverse(ast, {
    CallExpression(path) {
      transformWatch(path);
      tranformWatchEffect(path);
      transformLifecycle(path);
      transformNextTick(path);

      transformUndeclaredReactiveCall(path);
      transformUndeclaredComputedCall(path);
      transformUndeclaredReadonlyCall(path);
      transformUndeclaredToRefCall(path);
    },
  });
}
