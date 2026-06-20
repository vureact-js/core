import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
import { MACRO_API_NAMES } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { logger } from '@shared/logger';
import { recordImport } from '@transform/shared';
import { isCalleeNamed, replaceCallName, replaceNode } from '../../shared/babel-utils';
import { createUseImperativeHandle } from '../../shared/hook-creator';

export function resolveDefineModel(ctx: ICompilationContext): TraverseOptions {
  if (ctx.inputType !== 'sfc') return {};

  return {
    CallExpression(path) {
      const { node } = path;
      const { filename, scriptData } = ctx;

      if (!isCalleeNamed(node, MACRO_API_NAMES.model)) {
        return;
      }

      // TODO

      
      // 将 defineModel 替换为 ref 方便后续处理成 useVRef
      replaceCallName(node, 'ref');
    },
  };
}
