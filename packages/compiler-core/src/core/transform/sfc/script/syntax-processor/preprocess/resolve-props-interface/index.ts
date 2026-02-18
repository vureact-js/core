import { ParseResult as BabelParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { scriptBlockIR } from '@transform/sfc/script';
import { isCalleeNamed } from '@transform/sfc/script/shared/babel-utils';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { resolveDefineEmitsIface } from './resolve-emits';
import { resolveDefinePropsIface } from './resolve-props';
import { resolveDefineSlotsIface } from './resolve-slot';

/**
 * 处理和收集 defineProps、defineEmits 、defineSlots 的 TS 类型注释
 */
export function resolvePropsIface(ctx: ICompilationContext): TraverseOptions {
  const isTS = ctx.scriptData.lang.startsWith('ts');

  return {
    CallExpression(path) {
      const { node, parentPath } = path;
      const calleeName = (node.callee as t.Identifier).name;

      if (
        !isCalleeNamed(node, MACRO_API_NAMES.props) ||
        !isCalleeNamed(node, MACRO_API_NAMES.emits) ||
        !isCalleeNamed(node, MACRO_API_NAMES.slots)
      ) {
        return;
      }

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
