import * as t from '@babel/types';
import { capitalize } from '@utils/capitalize';
import { markReactive, ReactiveTypes } from '../shared/utils';
import { CallExpArgs, VarDeclKind } from '../types';
import { build$useState } from './react-hook-builder';

interface BaseOptions {
  reactiveType?: ReactiveTypes;
  varType?: t.TypeAnnotation | t.TSTypeAnnotation | t.Noop | null;
  callTypeParameters?: t.TSTypeParameterInstantiation | null;
  callTypeAnnotation?: t.TSType | null;
}

class ReactHookVarDeclarator {
  $useState(
    kind: VarDeclKind,
    name: string,
    args: CallExpArgs,
    opts?: Partial<
      BaseOptions & {
        setterPrefix: string;
      }
    >,
  ): t.VariableDeclaration {
    const setterName = `${opts?.setterPrefix || 'set'}${capitalize(name)}`;

    const id = t.arrayPattern([t.identifier(name), t.identifier(setterName)]);
    id.typeAnnotation = opts?.varType;

    const init = build$useState(args);
    init.typeParameters = opts?.callTypeParameters;

    if (t.isTSAsExpression(init) && opts?.callTypeAnnotation) {
      (init as t.TSAsExpression).typeAnnotation = opts.callTypeAnnotation;
    }

    const node = t.variableDeclarator(id, init);
    const result = t.variableDeclaration(kind, [node]);

    markReactive(result, opts?.reactiveType);

    return result;
  }
}

export const reactHookVarDecl = new ReactHookVarDeclarator();
