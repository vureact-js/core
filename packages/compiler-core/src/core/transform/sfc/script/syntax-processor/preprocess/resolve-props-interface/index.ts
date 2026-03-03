import { ParseResult as BabelParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { getScriptIR } from '@transform/sfc/script';
import { isCalleeNamed } from '@transform/sfc/script/shared/babel-utils';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { resolveDefineEmitsIface } from './resolve-emits';
import { resolveDefinePropsIface } from './resolve-props';
import { resolveDefineSlotsIface } from './resolve-slot';

/**
 * Handle defineProps/defineEmits/defineSlots TypeScript declarations.
 */
export function resolvePropsIface(ctx: ICompilationContext): TraverseOptions {
  const isTS = ctx.scriptData.lang.startsWith('ts');

  return {
    CallExpression(path) {
      const { node, parentPath } = path;
      const name = (node.callee as t.Identifier).name;

      if (
        !isCalleeNamed(node, MACRO_API_NAMES.props) &&
        !isCalleeNamed(node, MACRO_API_NAMES.emits) &&
        !isCalleeNamed(node, MACRO_API_NAMES.slots)
      ) {
        return;
      }

      const removePath = () => {
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

      if (!isTS) {
        const {
          scriptData: { propsTSIface },
        } = ctx;
        propsTSIface.hasPropsInJsEnv = true;
      } else {
        if (name === MACRO_API_NAMES.props) {
          resolveDefinePropsIface(path, ctx);
        } else if (name === MACRO_API_NAMES.emits) {
          resolveDefineEmitsIface(path, ctx);
        } else if (name === MACRO_API_NAMES.slots) {
          resolveDefineSlotsIface(path, ctx);
        }
      }

      removePath();
    },
  };
}

/**
 * Build component props TS interface node (without babel traverse).
 */
export function resolveCompIProps(ctx: ICompilationContext, ast: BabelParseResult) {
  const { propsTSIface, lang } = ctx.scriptData;
  const { propsTypes, emitTypes, slotTypes } = propsTSIface;
  const tsTypes = [...propsTypes, ...emitTypes, ...slotTypes];

  if (ctx.inputType !== 'sfc' || !lang.startsWith('ts') || !tsTypes.length) {
    return;
  }

  const n = ctx.compName || 'Comp';
  const ns = `I${camelCase(capitalize(n))}Props`;

  const typeNode = t.tsIntersectionType(tsTypes);
  const typeAliasDecl = t.tsTypeAliasDeclaration(t.identifier(ns), null, typeNode);
  const exportDecl = t.exportNamedDeclaration(typeAliasDecl);

  propsTSIface.name = ns;

  const scriptIR = getScriptIR(ctx);
  scriptIR.exports.push(exportDecl);

  void ast;
}
