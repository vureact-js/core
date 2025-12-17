import * as t from '@babel/types';
import { capitalize } from '@utils/capitalize';
import { CallExpArgs, VarDeclKind } from '../types';
import { buildUseMemo, buildUseReadonly, buildUseState$ } from './react-hook-builder';

interface BaseOptions {
  isShallow?: boolean;
  varType?: t.TypeAnnotation | t.TSTypeAnnotation | t.Noop | null;
  callTypeParameters?: t.TSTypeParameterInstantiation | null;
  callTypeAnnotation?: t.TSType | null;
}

class ReactHookVarDeclarator {
  private createVarId(
    name: string | [string, string],
    typeAnnotation: any,
  ): t.Identifier | t.ArrayPattern {
    const identifier =
      typeof name === 'string'
        ? t.identifier(name)
        : t.arrayPattern([t.identifier(name[0]), t.identifier(name[1])]);

    identifier.typeAnnotation = typeAnnotation;

    return identifier;
  }

  private handleCallFn(hook: t.CallExpression, opts?: BaseOptions): t.CallExpression {
    const init = hook;
    init.typeParameters = opts?.callTypeParameters;

    if (t.isTSAsExpression(init) && opts?.callTypeAnnotation) {
      (init as t.TSAsExpression).typeAnnotation = opts?.callTypeAnnotation;
    }

    return init;
  }

  useState$(
    kind: VarDeclKind,
    name: string,
    args: CallExpArgs,
    opts?: BaseOptions & {
      setterPrefix?: string;
    },
  ): t.VariableDeclaration {
    const setterPrefix = opts?.setterPrefix || 'set';
    const setterName = `${setterPrefix}${capitalize(name)}`;

    const declarator = t.variableDeclarator(
      this.createVarId([name, setterName], opts?.varType),
      this.handleCallFn(buildUseState$(args, opts?.isShallow), opts),
    );

    return t.variableDeclaration(kind, [declarator]);
  }

  useMemo(
    kind: VarDeclKind,
    name: string,
    args: CallExpArgs,
    opts?: BaseOptions,
  ): t.VariableDeclaration {
    const declarator = t.variableDeclarator(
      this.createVarId(name, opts?.varType),
      this.handleCallFn(buildUseMemo(args), opts),
    );

    return t.variableDeclaration(kind, [declarator]);
  }

  useReadonly(
    kind: VarDeclKind,
    name: string,
    args: CallExpArgs,
    opts?: BaseOptions,
  ): t.VariableDeclaration {
    const declarator = t.variableDeclarator(
      this.createVarId(name, opts?.varType),
      this.handleCallFn(buildUseReadonly(args, opts?.isShallow), opts),
    );
    return t.variableDeclaration(kind, [declarator]);
  }
}

export const reactHookVarDecl = new ReactHookVarDeclarator();
