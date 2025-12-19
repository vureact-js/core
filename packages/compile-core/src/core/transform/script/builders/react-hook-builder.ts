import * as t from '@babel/types';
import { React_Hooks, RV3_HOOKS } from '@consts/runtimeModules';
import { CallExpArgs } from '../shared/types';

type FunctionOrCallExpArg = t.Function | CallExpArgs;

class ReactHookBuilder {
  private baseBuild(name: string, args: CallExpArgs): t.CallExpression {
    return t.callExpression(t.identifier(name), args);
  }

  private baseBuildWithDeps(
    name: string,
    args: FunctionOrCallExpArg,
    deps: t.ArrayExpression = t.arrayExpression([]),
  ): t.CallExpression {
    let argArr = [];
    if (!Array.isArray(args) && t.isFunction(args)) {
      argArr.push(args, deps);
    } else {
      argArr = [...args, deps];
    }
    return this.baseBuild(name, argArr as CallExpArgs);
  }

  useState$(args: CallExpArgs, shallow = false): t.CallExpression {
    const name = !shallow ? RV3_HOOKS.useState$ : RV3_HOOKS.useShallowState;
    return this.baseBuild(name, args);
  }

  useReadonly(args: CallExpArgs, shallow = false): t.CallExpression {
    const name = !shallow ? RV3_HOOKS.useReadonly : RV3_HOOKS.useShallowReadonly;
    return this.baseBuild(name, args);
  }

  useMemo(args: FunctionOrCallExpArg, deps?: t.ArrayExpression): t.CallExpression {
    return this.baseBuildWithDeps(React_Hooks.useMemo, args, deps);
  }

  useCallback(args: FunctionOrCallExpArg, deps?: t.ArrayExpression): t.CallExpression {
    return this.baseBuildWithDeps(React_Hooks.useCallback, args, deps);
  }
}

export const reactHookBuilder = new ReactHookBuilder();
