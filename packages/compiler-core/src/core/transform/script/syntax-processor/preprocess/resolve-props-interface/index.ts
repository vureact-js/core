import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { COMP_PROPS_NAME, EMITS_API_VAR_NAME, SLOTS_API_VAR_NAME } from '@consts/other';
import { logger } from '@shared/logger';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { scriptBlockIR } from '../../..';
import { resolveDefineEmitsIface } from './resolve-emits';
import { resolveDefinePropsIface } from './resolve-props';
import { resolveDefineSlotsIface } from './resolve-slot';

/**
 * 处理和收集 defineProps、defineEmits 、defineSlots 的 TS 类型注释
 */
export function resolvePropsIface(ctx: ICompilationContext): TraverseOptions {
  const isTS = ctx.scriptData.lang.startsWith('ts');
  const macroVarNames: Record<string, string> = {
    defineProps: COMP_PROPS_NAME,
    defineEmits: EMITS_API_VAR_NAME,
    defineSlots: SLOTS_API_VAR_NAME,
  };

  return {
    CallExpression(path) {
      const { node, parentPath } = path;
      const calleeName = (node.callee as t.Identifier).name;
      const macroVarName = macroVarNames[calleeName];

      if (!macroVarName) {
        path.skip();
        return;
      }

      const { source } = ctx.scriptData;

      // 只在 ts 环境下处理
      if (isTS) {
        if (parentPath.isVariableDeclarator() && t.isIdentifier(parentPath.node.id)) {
          const curId = parentPath.node.id;

          if (curId.name !== macroVarName) {
            logger.error(
              `You must assign the result to the controlled variable "${macroVarName}". ` +
                'Do not use any other variable name',
              { source, file: ctx.filename, loc: curId.loc! },
            );
          }
        } else {
          logger.error(
            `You must assign the result to the controlled variable "${macroVarName}". `,
            {
              source,
              file: ctx.filename,
              loc: node.loc!,
            },
          );
        }

        if (calleeName === 'defineProps') {
          resolveDefinePropsIface(path, ctx);
        } else if (calleeName === 'defineEmits') {
          resolveDefineEmitsIface(path, ctx);
        } else if (calleeName === 'defineSlots') {
          resolveDefineSlotsIface(path, ctx);
        }
      }

      // 移除 api
      if (parentPath.isVariableDeclaration() || parentPath.isVariableDeclarator()) {
        parentPath.remove();
      } else {
        path.remove();
      }
    },
  };
}

/**
 * 生成组件 props TS 接口 （不经过 babel traverse）
 */
export function resolveCompIProps(ctx: ICompilationContext) {
  const { propsTSIface } = ctx.scriptData;
  const { propsTypes, emitTypes, slotTypes } = propsTSIface;

  const n = ctx.compName || 'Comp';
  const ns = `Type${camelCase(capitalize(n))}Props`;

  const typeNode = t.tsIntersectionType([...propsTypes, ...emitTypes, ...slotTypes]);
  const decl = t.tsTypeAliasDeclaration(t.identifier(ns), null, typeNode);

  propsTSIface.name = ns;

  // 导出类型声明
  scriptBlockIR.exports.push(t.exportNamedDeclaration(decl));
}
