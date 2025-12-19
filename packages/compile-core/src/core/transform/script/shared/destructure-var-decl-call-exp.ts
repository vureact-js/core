import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { getVarKind } from './babel-utils';
import { CallExpArgs, VarDeclKind } from './types';

export interface VarDeclCallExpDestructureResult {
  kind: VarDeclKind;
  name?: string;
  callExpName?: string;
  callExpArgs: CallExpArgs;
  tsTypes: VarDeclTSTypes;
}

export interface VarDeclTSTypes {
  varId: t.Noop | t.TSTypeAnnotation | t.TypeAnnotation | null | undefined;
  callExp: {
    typeAnnotation: null | t.TSType;
    typeParameters: null | t.TSTypeParameterInstantiation;
  };
}

/**
 * @private
 *
 * @description
 * destructure variable declaration call expression.
 */
class DestructureVarDeclCallExp {
  private path: NodePath<t.VariableDeclarator> = {} as any;
  private node: t.VariableDeclarator = {} as any;

  destructure(path: NodePath<t.VariableDeclarator>): VarDeclCallExpDestructureResult {
    this.path = path;
    this.node = path.node;

    return {
      kind: this.getKind(),
      name: this.getName(),
      callExpName: this.getCallExpName(),
      callExpArgs: this.getCallExpArgs(),
      tsTypes: {
        varId: this.getVarIdTSType(),
        callExp: this.getCallExpTSTypes(),
      },
    };
  }

  getKind(): VarDeclCallExpDestructureResult['kind'] {
    return getVarKind(this.path);
  }

  getName(): VarDeclCallExpDestructureResult['name'] {
    const { id } = this.node;
    if (t.isIdentifier(id)) {
      return id.name;
    }
  }

  getCallExpName(): VarDeclCallExpDestructureResult['callExpName'] {
    const { init } = this.node;

    if (t.isTSAsExpression(init)) {
      const { expression } = init;
      if (t.isCallExpression(expression) && t.isIdentifier(expression.callee)) {
        return expression.callee.name;
      }
    }

    if (t.isCallExpression(init) && t.isIdentifier(init.callee)) {
      return init.callee.name;
    }
  }

  getCallExpArgs(): VarDeclCallExpDestructureResult['callExpArgs'] {
    const { init } = this.node;
    if (t.isCallExpression(init)) {
      return init.arguments;
    }
    return [];
  }

  getVarIdTSType(): VarDeclTSTypes['varId'] {
    const { id } = this.node;
    if (t.isIdentifier(id)) {
      return id.typeAnnotation;
    }
  }

  getCallExpTSTypes(): VarDeclTSTypes['callExp'] {
    const { init } = this.node;
    const types = {
      typeAnnotation: null as null | t.TSType,
      typeParameters: null as null | t.TSTypeParameterInstantiation,
    };

    if (t.isTSAsExpression(init)) {
      types.typeAnnotation = init.typeAnnotation;
    }

    if (t.isCallExpression(init)) {
      types.typeParameters = init.typeParameters as any;
    }

    return types;
  }
}

export const varDeclCallExp = new DestructureVarDeclCallExp();
