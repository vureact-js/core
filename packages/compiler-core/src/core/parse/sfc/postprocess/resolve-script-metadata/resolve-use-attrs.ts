import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { isCalleeNamed } from '@transform/sfc/script/shared/babel-utils';

/**
 * 根据是否有 useAttrs 钩子而启用/关闭 options.inheritAttrs 选项
 */
export function resolveUseAttrs(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  const { node } = path;
  const {
    scriptData: { declaredOptions },
  } = ctx;

  // 如果未使用该 hook，则 inheritAttrs 不允许生效
  // 这是因为不支持 $attrs 运行时的默认根节点注入
  if (!isCalleeNamed(node, VUE_API_MAP.useAttrs)) {
    // 开启变为关闭
    if (declaredOptions.inheritAttrs) {
      declaredOptions.inheritAttrs = false;
    } else if (declaredOptions.inheritAttrs === false) {
      // 显式关闭状态需重置
      declaredOptions.inheritAttrs = undefined;
    }
    return;
  }

  // hook 存在时开启
  if (typeof declaredOptions.inheritAttrs === 'undefined') {
    declaredOptions.inheritAttrs = true;
  }
}
