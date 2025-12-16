import * as t from '@babel/types';

class ReactiveVariableDeclarator<T extends t.VariableDeclarator> {
  private node: T = {} as T;

  init(node: T) {
    this.node = node;
  }

  varName() {
    const { id } = this.node;
    if (t.isIdentifier(id)) {
      return id.name;
    }
  }

  apiName() {
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

  varType() {
    const { id } = this.node;
    if (t.isIdentifier(id)) {
      return id.typeAnnotation;
    }
  }

  apiTSTypes() {
    const { init } = this.node;
    const types = {
      annotation: null as null | t.TSType,
      parameters: null as null | t.TSTypeParameterInstantiation,
    };

    if (t.isTSAsExpression(init)) {
      types.annotation = init.typeAnnotation;
    }

    if (t.isCallExpression(init)) {
      types.parameters = init.typeParameters as any;
    }

    return types;
  }

  apiArgs() {
    const { init } = this.node;
    if (t.isCallExpression(init)) {
      return init.arguments;
    }
    return [];
  }
}

export const reactiveVarDecl = new ReactiveVariableDeclarator();
