import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_HOOKS } from '@consts/adapters-map';
import { PACKAGE_NAME } from '@consts/other';
import { getReactiveType } from '@shared/reactive-utils';
import { recordImport } from '@transform/shared';
import { getVariableDeclaratorPath, replaceCallName } from '../../shared/babel-utils';
import { setScriptNodeMeta } from '../../shared/metadata-utils';

/**
 * 此类 api 只需要替换调用名即可，无需进行其他处理，
 * 由对应运行时适配 api 完全模拟它们。
 */
export function resolveSimpleAdapter(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;
      const { callee } = node;

      if (!t.isIdentifier(callee)) return;

      const { name: originalName } = callee;
      const { lifecycle, ...misc } = ADAPTER_HOOKS.simple;

      const miscAdapter = misc[originalName as keyof typeof misc];
      const lifecycleAdapter = lifecycle[originalName as keyof typeof lifecycle];

      const adapter = miscAdapter || lifecycleAdapter;
      if (!adapter) return;

      if (miscAdapter) {
        const reactiveType = getReactiveType(originalName);
        const declaratorPath = getVariableDeclaratorPath(path);

        setScriptNodeMeta(declaratorPath?.node, {
          is_reactive: true,
          reactive_type: reactiveType,
        });
      }

      // 替换成适配 hook 名
      // 由于对应的适配 hook 在用法/功能/语义上完全模拟，因此直接替换函数调用名即可
      replaceCallName(node, adapter);
      recordImport(ctx, PACKAGE_NAME.runtime, adapter);
    },
  };
}
