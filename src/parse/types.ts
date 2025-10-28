import * as t from '@babel/types';
import type {
  CompilerOptions,
  DirectiveNode,
  ElementNode,
  InterpolationNode,
  RootNode,
} from '@vue/compiler-core';

interface ParsedResult {
  filename: string;
  componentName: string;
  template: ExtendedRootNode | null;
  script: ScriptInfo | null;
  styles: StyleInfo[];
}

interface ParseOptions {
  filename?: string;
  sourceMap?: boolean;
  vueCompilerOptions?: CompilerOptions;
}

// 统一节点类型
type ExtendedNode =
  | ExtendedRootNode
  | ExtendedElementNode
  | ExtendedDirectiveNode
  | ExtendedInterpolationNode;

// 扩展 RootNode，包含脚本和样式信息
// Extend RootNode to include script and style information
type ExtendedRootNode = RootNode & {
  // 顶层依赖（如模板和脚本中使用的变量）
  // Top-level dependencies (e.g., variables used in template and script)
  dependencies: Set<string>;
  // 用于记录非响应式场景 DOM ref
  // Used to record non-reactive scene DOM ref
  nonReactivies: Set<string>;
};

// 扩展 ElementNode，标记组件和依赖
// Extend ElementNode to mark components and dependencies
type ExtendedElementNode = ElementNode & {
  pre?: boolean;
  isBuiltIn?: boolean;
  dynamicTag?: string;
  // 节点中使用的变量（如 v-bind:class="obj" 的 obj）
  // Variables used in node (e.g., obj in v-bind:class="obj")
  dependencies?: Set<string>;
  // 预映射的 JSX 属性，供 transform 阶段使用
  // Pre-mapped JSX attributes for transform phase
  babelProps?: t.JSXAttribute[];
};

// 扩展 DirectiveNode，使用交集类型
type ExtendedDirectiveNode = DirectiveNode & {
  dependencies?: Set<string>; // 指令中使用的变量（如 v-bind:class="obj.key" 的 obj）
  babelExp?: t.Expression; // 预解析的 Babel 表达式，供 transform 阶段使用
  babelArgExp?: t.Expression; // 用于存储动态参数的 Babel AST。
};

// 扩展 InterpolationNode，使用交集类型
type ExtendedInterpolationNode = InterpolationNode & {
  dependencies?: Set<string>; // 插值中使用的变量（如 {{ count }} 的 count）
  babelExp?: t.Expression;
};

// 扩展脚本中的 VariableDeclarator，使用交集类型
type ExtendedVariableDeclarator = t.VariableDeclarator & {
  reactiveType?: string; // 响应式类型
  // 用于记录非响应式场景（如 DOM 引用、持久化值不触发渲染），应转为 React 的 useRef
  // Used to record non-reactive scenarios (such as DOM references, persistent values ​​that do not trigger rendering)
  isReactive?: boolean;
};

interface ScriptInfo {
  file: t.File;
  lang: string;
  sourceCode: string;
}

// 样式信息接口，用于 <style> 部分
// StyleInfo interface for <style> section
interface StyleInfo {
  content: string;
  scoped?: boolean;
  module?: boolean;
  lang?: string;
  // Get it from the name attribute of the style
  name?: string;
  // 样式中涉及的响应式变量（如 v-bind(color) 的 color）
  // Reactive variables in style (e.g., color in v-bind(color))
  dependencies?: Set<string>;
}

export type {
  ExtendedDirectiveNode,
  ExtendedElementNode,
  ExtendedInterpolationNode,
  ExtendedNode,
  ExtendedRootNode,
  ExtendedVariableDeclarator,
  ParsedResult,
  ParseOptions,
  ScriptInfo,
  StyleInfo,
};
