import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { isCalleeNamed } from '@transform/sfc/script/shared/babel-utils';

/**
 * 检测 useAttrs() 调用是否存在
 */
export function resolveUseAttrsExists(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  const { node } = path;
  const { templateData, scriptData } = ctx;

  if (!isCalleeNamed(node, VUE_API_MAP.useAttrs)) {
    return;
  }

  if (scriptData?.hasUseAttrsCall) {
    return;
  }

  scriptData.hasUseAttrsCall = true;

  // 取父节点的变量标识符名称
  const parent = path.parentPath?.node;

  if (parent && t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
    templateData.declaredAttrs = parent.id.name;
  }
}
