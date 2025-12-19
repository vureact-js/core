import * as t from '@babel/types';

export type VarDeclKind = 'var' | 'let' | 'const' | 'using' | 'await using';

export type CallExpArgs = Array<t.Expression | t.SpreadElement | t.ArgumentPlaceholder>;

export type ReactiveTypes =
  | 'ref'
  | 'toRef'
  | 'toRefs'
  | 'customRef'
  | 'shallowRef'
  | 'reactive'
  | 'shallowReactive'
  | 'computed'
  | 'readonly'
  | 'shallowReadonly';
