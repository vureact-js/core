import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { recordImport } from '@transform/shared';
import {
  findRootIdentifier,
  findRootVariablePath,
  isCalleeNamed,
  replaceCallName,
} from '../../shared/babel-utils';

/**
 * 解决 Vue 的 useTemplateRef
 */
export function resolveTemplateRef(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, VUE_API_MAP.useTemplateRef)) return;

      addTypeParam(ctx, path);
      replaceValue(node);
      replaceCallName(node, REACT_API_MAP.useRef);
      recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.useRef);
    },

    MemberExpression(path) {
      const { node } = path;
      if (node.computed || !t.isIdentifier(node.property) || node.property.name !== 'value') {
        return;
      }

      const rootPath = findRootVariablePath(path);
      if (
        !rootPath?.node ||
        !t.isCallExpression(rootPath.node.init) ||
        !isCalleeNamed(rootPath.node.init, REACT_API_MAP.useRef)
      ) {
        return;
      }

      const rootId = findRootIdentifier(node);
      // 仅当当前成员表达式直接以 ref 标识符为对象（例如 `a.value`）时才替换
      // 避免将 `a.value.b.value` 中的深层 `.value` 也替换为 `.current`
      if (!t.isIdentifier(node.object) || node.object.name !== rootId?.name) {
        return;
      }

      node.property.name = 'current';
    },
  };
}

function replaceValue(node: t.CallExpression) {
  const initVal = node.arguments[0];
  const newVal = t.identifier('null');

  // 复制代码位置信息
  newVal.start = initVal?.start;
  newVal.end = initVal?.end;
  newVal.loc = initVal?.loc;

  // 初始值替换成 null
  node.arguments[0] = newVal;
}

function addTypeParam(ctx: ICompilationContext, path: NodePath<t.CallExpression>) {
  const { templateData, scriptData } = ctx;
  const { node, parent } = path;

  if (!scriptData.lang.startsWith('ts') && !t.isVariableDeclarator(parent)) {
    return;
  }

  const idName = ((parent as t.VariableDeclarator).id as t.Identifier).name;
  const bindingMeta = templateData.refBindings[idName];

  // 添加对应的 html 标签类型名
  if (!node.typeParameters && bindingMeta) {
    node.typeParameters = t.tsTypeParameterInstantiation([
      t.tsTypeReference(t.identifier(bindingMeta.htmlType)),
    ]);
  }
}
