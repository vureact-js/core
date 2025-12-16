import * as t from '@babel/types';

export type VarDeclKind = 'var' | 'let' | 'const' | 'using' | 'await using';

export type CallExpArgs = Array<t.Expression | t.SpreadElement | t.ArgumentPlaceholder>;
