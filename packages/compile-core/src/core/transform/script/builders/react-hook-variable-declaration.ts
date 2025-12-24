import * as t from '@babel/types';
import { React_Hooks, RV3_HOOKS } from '@consts/runtimeModules';
import { capitalize } from '@utils/capitalize';
import { setNodeExtensionMeta } from '../shared/babel-utils';
import { VarDeclCallExpDestructureResult } from '../shared/destructure-var-decl-call-exp';
import { ReactiveTypes } from '../shared/types';
import { reactHookBuilder } from './react-hook-builder';

interface VarDeclHookCreateOptions extends VarDeclCallExpDestructureResult {
  reactiveType: ReactiveTypes;
  deps?: t.ArrayExpression;
  shallow?: boolean;
  setterNamePrefix?: string;
}

/**
 * @private
 *
 * @description
 * create react hook variable declaration
 */
class ReactHookVariableDeclaration {
  private createDeclaration(hookName: string, options: VarDeclHookCreateOptions) {
    const { kind, name, callExpArgs, setterNamePrefix, deps, shallow, tsTypes, reactiveType } =
      options;

    let getterName = name!;
    let setterName;
    let declarator: t.VariableDeclarator;

    switch (hookName) {
      case RV3_HOOKS.useState$: {
        setterName = `${setterNamePrefix || 'set'}${capitalize(getterName)}`;
        declarator = this.createDeclarator(
          [getterName, setterName],
          reactHookBuilder.useState$(callExpArgs, shallow),
          tsTypes,
        );
        break;
      }

      case RV3_HOOKS.useReadonly: {
        declarator = this.createDeclarator(
          getterName,
          reactHookBuilder.useReadonly(callExpArgs, shallow),
          tsTypes,
        );
        break;
      }

      case React_Hooks.useMemo: {
        declarator = this.createDeclarator(
          getterName,
          reactHookBuilder.useMemo(callExpArgs, deps),
          tsTypes,
        );
        break;
      }
    }

    const node = t.variableDeclaration(kind, [declarator!]);
    setNodeExtensionMeta(node, { getterName, setterName, reactiveType });

    return node;
  }

  private createDeclarator(
    name: string | [string, string],
    init: t.CallExpression,
    tsTypes: VarDeclHookCreateOptions['tsTypes'],
  ) {
    return t.variableDeclarator(
      this.handleIdentifer(name, tsTypes.varId),
      this.handleCallExpTSType(init, tsTypes.callExp),
    );
  }

  private handleIdentifer(
    name: string | [string, string],
    typeAnnotation: any,
  ): t.Identifier | t.ArrayPattern {
    let identifier;

    if (typeof name === 'string') {
      identifier = t.identifier(name);
    } else {
      identifier = t.arrayPattern([t.identifier(name[0]), t.identifier(name[1])]);
    }

    identifier.typeAnnotation = typeAnnotation;

    return identifier;
  }

  private handleCallExpTSType(
    callExp: t.CallExpression,
    tsTypes: VarDeclHookCreateOptions['tsTypes']['callExp'],
  ): t.CallExpression {
    const { typeAnnotation, typeParameters } = tsTypes;

    if (t.isTSAsExpression(callExp) && typeAnnotation) {
      (callExp as t.TSAsExpression).typeAnnotation = typeAnnotation;
    }

    callExp.typeParameters = typeParameters;

    return callExp;
  }

  useState$(opts: VarDeclHookCreateOptions): t.VariableDeclaration {
    return this.createDeclaration(RV3_HOOKS.useState$, opts);
  }

  useMemo(opts: VarDeclHookCreateOptions): t.VariableDeclaration {
    return this.createDeclaration(React_Hooks.useMemo, opts);
  }

  useReadonly(opts: VarDeclHookCreateOptions): t.VariableDeclaration {
    return this.createDeclaration(RV3_HOOKS.useReadonly, opts);
  }
}

export const reactHookVarDecl = new ReactHookVariableDeclaration();
