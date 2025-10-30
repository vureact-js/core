import * as t from '@babel/types';
import type { REACTIVE_TYPE } from '@constants/vue';
import type { ExtendedVariableDeclarator as PrasedVariableDeclarator } from '@parse/types';
import type { TransformedImportInfo } from '@transform/types';

interface ExtendedVariableDeclarator extends PrasedVariableDeclarator {}

interface ScriptInfo {
  ast: t.File;
  context: ScriptTransformContext;
}

interface ReactiveBinding {
  name: string; // Variable name, e.g., inputValue
  reactiveType: keyof typeof REACTIVE_TYPE; // Reactive type, e.g., ref
  initialValue?: t.Expression;
  dependencies?: Set<string>;
  isComplex?: boolean; // Is complex expression, e.g., obj.prop
}

// 脚本转换上下文 / Script transform context
interface ScriptTransformContext {
  lang: string;
  filename: string;
  // 响应式变量，扩展 parse 阶段的 reactiveType / Reactive bindings, extend parse phase reactiveType
  reactiveBindings: ReactiveBinding[];
  // defineProps 定义的 prop，如 title / Props defined by defineProps, e.g., title
  props: PropDefinition[];
  // defineEmits 定义的事件，如 onUpdate_Title / Emits defined by defineEmits, e.g., onUpdate_Title
  emits: EmitDefinition[];
  // 生命周期钩子，记录函数体和依赖 / Lifecycle hooks, store function body and dependencies
  lifecycleHooks: LifecycleHook[];
  callbackDeps: Set<string>;
  // Collect needed React/third-party import names
  imports: TransformedImportInfo;
}

interface PropDefinition {
  name: string;
  type: t.TSType;
  required?: boolean;
  defaultValue?: t.Expression;
}

interface EmitDefinition {
  eventName: string;
  rawEventName: string;
  parameters: Array<{
    name: string;
    type: t.TSType | t.TSNamedTupleMember;
  }>;
  optional?: boolean;
}

interface LifecycleHook {
  hook: string;
  body: t.Statement[];
  dependencies?: Set<string>;
}

export type {
  EmitDefinition,
  ExtendedVariableDeclarator,
  PropDefinition,
  ReactiveBinding,
  ScriptInfo,
  ScriptTransformContext,
};
