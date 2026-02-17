import { ParseResult as BabelParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { COMP_PROPS_NAME, EMITS_API_VAR_NAME, SLOTS_API_VAR_NAME } from '@consts/other';
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

      if (!macroVarName) return;

      const { source } = ctx.scriptData;

      const removePath = () => {
        // 移除 api
        if (parentPath.isVariableDeclaration() || parentPath.isVariableDeclarator()) {
          parentPath.remove();
        } else {
          path.remove();
        }
      };

      if (ctx.inputType !== 'sfc') {
        removePath();
        return;
      }

      if (isTS) {
        if (calleeName === 'defineProps') {
          resolveDefinePropsIface(path, ctx);
        } else if (calleeName === 'defineEmits') {
          resolveDefineEmitsIface(path, ctx);
        } else if (calleeName === 'defineSlots') {
          resolveDefineSlotsIface(path, ctx);
        }
      }

      removePath();
    },
  };
}

/**
 * 生成组件 props TS 接口 （不经过 babel traverse）
 */
export function resolveCompIProps(ctx: ICompilationContext, ast: BabelParseResult) {
  const { propsTSIface, lang } = ctx.scriptData;
  const { propsTypes, emitTypes, slotTypes } = propsTSIface;

  if (!lang.startsWith('ts')) return;

  const n = ctx.compName || 'Comp';
  const ns = `I${camelCase(capitalize(n))}Props`;

  const typeNode = t.tsIntersectionType([...propsTypes, ...emitTypes, ...slotTypes]);
  const typeAliasDecl = t.tsTypeAliasDeclaration(t.identifier(ns), null, typeNode);
  const exportDecl = t.exportNamedDeclaration(typeAliasDecl);

  propsTSIface.name = ns;
  scriptBlockIR.exports.push(exportDecl);
}
