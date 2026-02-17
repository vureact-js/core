import * as t from '@babel/types';
import { ReactiveTypes } from '@shared/reactive-utils';

export interface ScriptNodeMeta {
  is_reactive?: boolean;
  reactive_type?: ReactiveTypes;
  is_use_ref?: boolean;
  is_deps_analyzed?: boolean;
  cleanup?: boolean;
}

const META_KEY = '__vureact_metadata';

export function getScriptNodeMeta(node: t.Node): ScriptNodeMeta {
  return (node as any)[META_KEY];
}

export function setScriptNodeMeta(node: t.Node | undefined, opts: ScriptNodeMeta) {
  if (!node) return;

  if (opts.cleanup) {
    opts = {};
  } else {
    opts.is_reactive = opts.is_reactive ?? false;
    opts.reactive_type = opts.reactive_type || 'none';
  }

  (node as any)[META_KEY] = opts;
}
