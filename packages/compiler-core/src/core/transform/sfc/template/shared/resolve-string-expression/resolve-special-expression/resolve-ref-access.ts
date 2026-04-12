import { ICompilationContext } from '@compiler/context/types';

/**
 * 处理响应式 ref() 的值访问，将其还原成 ref.value 的访问形式
 */
export function resolveRefAccess(input: string, ctx: ICompilationContext): string {
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
