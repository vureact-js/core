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
  getVariableDeclaratorPath,
  isCalleeNamed,
  replaceCallName,
} from '../../shared/babel-utils';

/**
 * 解决 Vue 的 useTemplateRef 与组件 ref
 */
export function resolveElementRef(ctx: ICompilationContext): TraverseOptions {
  return {
    CallExpression(path) {
      const {
        inputType,
        templateData: { refBindings },
      } = ctx;

      if (inputType !== 'sfc') return;

      const { node } = path;

      // 判断当前调用是否为 Vue 的 useTemplateRef API
      const isUseTemplateRef = isCalleeNamed(node, VUE_API_MAP.useTemplateRef);

      // 判断当前调用是否为 Vue 的 ref API 且存在组件引用绑定
      const isCompRefBindings =
        Object.keys(refBindings.componentRefs).length > 0 && isCalleeNamed(node, VUE_API_MAP.ref);

      // 需要处理的场景：Vue 的 useTemplateRef 或存在组件引用时的 ref 调用
      const shouldProcess = isUseTemplateRef || isCompRefBindings;

      if (!shouldProcess) {
        return;
      }

      // 如果是组件引用绑定场景，需进一步验证变量名是否存在于组件引用映射中
      if (isCompRefBindings) {
        const varDeclaratorPath = getVariableDeclaratorPath(path)?.node;
        if (!t.isIdentifier(varDeclaratorPath?.id)) {
          return;
        }

        const varName = varDeclaratorPath.id.name;
        const compRef = refBindings.componentRefs[varName];

        // 若变量名不在组件引用映射中，则跳过处理
        if (!compRef) return;
      }

      // 将 Vue ref 调用的初始参数替换为 React useRef 所需的 null
      node.arguments[0] = t.identifier('null');

      // 解析并添加 TypeScript 类型参数（如需要）
      resolveTypeParameters(ctx, path);

      // 将 Vue 的 API 调用名替换为 React 的 useRef
      replaceCallName(node, REACT_API_MAP.useRef);
      recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.useRef);
    },

    MemberExpression(path) {
      resolveRefValueToCurrent(path);
    },
  };
}

function resolveTypeParameters(ctx: ICompilationContext, path: NodePath<t.CallExpression>) {
  const {
    templateData: { refBindings },
    scriptData,
  } = ctx;

  const { node } = path;
  const varDeclaratorNode = getVariableDeclaratorPath(path)?.node;

  // 仅在 TypeScript 环境下或父节点是变量声明时才处理类型参数
  if (!scriptData.lang.startsWith('ts') || !varDeclaratorNode) {
    return;
  }

  // 获取变量声明的标识符名称
  const idName = (varDeclaratorNode.id as t.Identifier).name;

  // 从模板数据中获取 DOM 引用和组件引用的元数据
  const domBindingMeta = refBindings.domRefs[idName];
  const compBindingMeta = refBindings.componentRefs[idName];

  // 如果节点没有类型参数且存在对应的引用绑定元数据，则添加类型参数
  if (!node.typeParameters && (domBindingMeta || compBindingMeta)) {
    // 组件 ref 默认使用 any 泛型，DOM ref 使用对应的 HTML 元素类型
    const type = compBindingMeta ? 'any' : domBindingMeta!.htmlType;

    // 创建类型参数实例化节点并赋值给原节点
    node.typeParameters = t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier(type))]);
  }
}

/**
 * 解决将 ref .value 访问变成 .current 访问
 */
function resolveRefValueToCurrent(path: NodePath<t.MemberExpression>) {
  const { node } = path;

  // 检查是否为 .value 访问：确保不是计算属性访问，且属性名是 'value'
  if (node.computed || !t.isIdentifier(node.property) || node.property.name !== 'value') {
    return;
  }

  // 查找当前成员表达式所属的变量声明路径
  const rootPath = findRootVariablePath(path);

  // 验证该变量是否由 useRef 初始化
  if (
    !rootPath?.node ||
    !t.isCallExpression(rootPath.node.init) ||
    !isCalleeNamed(rootPath.node.init, REACT_API_MAP.useRef)
  ) {
    return;
  }

  // 获取成员表达式的根标识符（例如 `a` 来自 `a.value`）
  const rootId = findRootIdentifier(node);

  // 仅当当前成员表达式直接以 ref 标识符为对象（例如 `a.value`）时才替换
  // 避免将 `a.value.b.value` 中的深层 `.value` 也替换为 `.current`
  if (!t.isIdentifier(node.object) || node.object.name !== rootId?.name) {
    return;
  }

  // 将 Vue 的 .value 替换为 React 的 .current
  node.property.name = 'current';
}
