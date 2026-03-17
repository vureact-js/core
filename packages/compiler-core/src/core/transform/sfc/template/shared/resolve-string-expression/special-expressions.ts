import { ICompilationContext } from '@compiler/context/types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';

/**
 * 解决各种需要特殊处理的模板字符串表达式
 */
export function resolveSpecialExpressions(input: string, ctx: ICompilationContext): string {
  input = resolveEmitsCalls(input, ctx);
  input = resolveRefVariable(input, ctx);
  return input;
}

/**
 * 将模板中的 defineProps/defineEmits 宏调用， 替换为 [propField]?.xxx，并转为 React 风格的调用。
 *
 * 例如：emits('click', e) => [propField]?.onClick?.(e)
 */
function resolveEmitsCalls(input: string, ctx: ICompilationContext): string {
  const result = matchEmitCalls(input, ctx);
  if (!result) return input;

  const [, , eventName, args] = result;

  const callee = eventName!
    .split(/[:\-]/)
    .map((part) => capitalize(camelCase(part)))
    .join('');

  // fix: 事件调用统一变为可选的
  const event = args ? `on${callee}?.(${args})` : `on${callee}?.()`;
  return `${ctx.propField}?.${event}`;
}

function matchEmitCalls(input: string, ctx: ICompilationContext): RegExpMatchArray | null {
  const { reactiveBindings } = ctx.templateData;

  const macroBinding = Object.values(reactiveBindings).find((b) => b.source === 'defineEmits');
  if (!macroBinding) return null;

  // 转义特殊字符，防止正则注入
  const escapedName = macroBinding.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 动态创建正则，支持各种引号和空格
  const regex = new RegExp(
    `${escapedName}\\s*\\(\\s*` + // name(
      `(['"\`])([^\\1]*?)\\1` + // 引号内的内容（支持嵌套引号）
      `\\s*(?:,\\s*(.*?))?\\s*\\)$`, // 可选的第二个参数
    's', // s 标志让 . 匹配换行符
  );

  return input.trim().match(regex);
}

/**
 * 包装模板中的 ref 变量，将其还原成 varName.value 的访问形式
 */
function resolveRefVariable(input: string, ctx: ICompilationContext): string {
  const { reactiveBindings } = ctx.templateData;

  const addValueProperty = (input: string, varName: string): string => {
    // 1. 转义变量名中的正则特殊字符
    const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 2. 使用 RegExp 构造函数，确保点被正确转义（\\\. 表示字面点）
    // 避免替换对象属性中的同名字段，如 member.leads
    const regex = new RegExp(
      `(?<![a-zA-Z0-9_\\.])${escapedVarName}(?![a-zA-Z0-9_])(?!\\.value)`,
      'g',
    );

    return input.replace(regex, `${varName}.value`);
  };

  for (const name in reactiveBindings) {
    const binding = reactiveBindings[name];
    if (binding?.reactiveType !== 'ref') continue;
    input = addValueProperty(input, name);
  }

  return input;
}
