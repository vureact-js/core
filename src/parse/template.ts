import { VUE_BUILT_IN_COMPS, VUE_DIR } from '@constants/vue';
import { isUndefined } from '@utils/types';
import { baseParse, NodeTypes } from '@vue/compiler-core';
import type {
  ExtendedDirectiveNode,
  ExtendedElementNode,
  ExtendedInterpolationNode,
  ExtendedNode,
  ExtendedRootNode,
  ParseOptions,
} from './types';
import { extractDepsAndExpr } from './utils';

// 解析模板，生成扩展的 Vue AST
// Parse template to generate extended Vue AST
export function parseTemplate(
  templateContent?: string,
  options?: ParseOptions
): ExtendedRootNode | null {
  if (!templateContent) {
    return null;
  }
  const vueAst = baseParse(templateContent, options?.vueCompilerOptions);
  const extendedAst = markTemplateDependencies(vueAst as ExtendedRootNode);
  return extendedAst;
}

function markTemplateDependencies(
  rootNode: ExtendedRootNode
): ExtendedRootNode {
  const nonReactivies = new Set<string>();
  let rootDependencies = new Set<string>();

  // 递归遍历 AST，标记每个节点的依赖和属性
  // Recursively traverse AST, mark dependencies and properties for each node
  const traverse = (node: ExtendedNode) => {
    if (isUndefined(node)) return;

    const handleElement = () => {
      if (node.type !== NodeTypes.ELEMENT) return;
      const elementNode = node as ExtendedElementNode;

      if (elementNode.pre) return;
      // @ts-ignore
      if (VUE_BUILT_IN_COMPS[elementNode.tag]) {
        elementNode.isBuiltIn = true;
      }

      const handleProps = () => {
        elementNode.props.forEach(prop => {
          if (prop.type === NodeTypes.ATTRIBUTE && prop.value?.content) {
            const { content } = prop.value;
            if (prop.name === 'is') elementNode.dynamicTag = content;
            if (prop.name === 'ref') nonReactivies.add(content);
          }

          if (prop.type === NodeTypes.DIRECTIVE) {
            const directive = prop as ExtendedDirectiveNode;

            if (directive.name === VUE_DIR.skip) {
              elementNode.pre = true;
              return;
            }

            if (directive.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
              const { content } = directive.exp;
              if (directive.name === 'is') elementNode.dynamicTag = content;
              if (directive.name === 'ref') nonReactivies.add(content);

              // 处理指令的值表达式 (directive.exp)，例如 v-bind="obj", v-if="condition"
              // Processing instruction value expression
              const { expression, dependencies } = extractDepsAndExpr(
                directive.exp
              );
              directive.babelExp = expression;
              rootDependencies = rootDependencies.union(dependencies);
            }

            // 处理动态指令的参数表达式 (directive.arg)，例如 v-bind:[attrName]
            // Processing parameter expressions for dynamic directives
            if (directive.arg?.type === NodeTypes.SIMPLE_EXPRESSION) {
              const { arg } = directive;
              // 只有 isStatic 为 false 的参数才是动态表达式，需要解析和收集依赖
              // Only handle dynamic expression
              if (!arg.isStatic) {
                const { expression, dependencies } = extractDepsAndExpr(arg);
                directive.babelArgExp = expression;
                rootDependencies = rootDependencies.union(dependencies);
              }
            }
          }
        });
      };
      handleProps();
    };

    // 处理插值表达式的依赖
    // Process dependencies in interpolation expressions
    const handleInterpolation = () => {
      if (node.type !== NodeTypes.INTERPOLATION) return;
      const interpolationNode = node as ExtendedInterpolationNode;
      const { expression, dependencies } = extractDepsAndExpr(
        interpolationNode.content
      );
      interpolationNode.babelExp = expression;
      rootDependencies = rootDependencies.union(dependencies);
    };

    handleElement();
    handleInterpolation();

    (node as ExtendedElementNode)?.children?.forEach(c => {
      traverse(c as ExtendedNode);
    });
  };

  traverse(rootNode);

  rootNode.nonReactivies = nonReactivies;
  rootNode.dependencies = rootDependencies;

  return rootNode;
}
