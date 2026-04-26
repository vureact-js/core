import { ICompilationContext } from '@compiler/context/types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';

/**
 * 将模板中的 defineProps/defineEmits 宏调用， 替换为 [propField].xxx，并转为 React 风格的调用。
 *
 * 例如：emits('click', e) => [propField].onClick?.(e)
 */
export function resolveEmitsCalls(input: string, ctx: ICompilationContext): string {
  const { reactiveBindings } = ctx.templateData;

  // 匹配 emit() 调用
  const matchEmitCalls = (): RegExpMatchArray | null => {
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
  };

  const result = matchEmitCalls();

  if (!result) return input;

  const [, , eventName, args] = result;

  const callee = eventName!
    .split(/[:\-]/)
    .map((part) => capitalize(camelCase(part)))
    .join('');

  // fix: 事件调用统一变为可选的
  const event = args ? `on${callee}?.(${args})` : `on${callee}?.()`;

  // re: 取消根标识符的可选链
  return `${ctx.propField}.${event}`;
}
