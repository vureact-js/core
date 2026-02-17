import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { COMP_PROPS_NAME } from '@consts/other';
import { stringToExpr } from '@shared/babel-utils';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';

const EMITS_MACRO_REGEX = /^$$emits*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*(.*))?\s*\)$/;

/**
 * 解决模板字符串表达式
 */
export function resolveStringExpr(
  input: string,
  ctx: ICompilationContext,
  toStrLiteral = false,
): t.Expression {
  if (toStrLiteral) return t.stringLiteral(input);

  const { filename, scriptData } = ctx;
  const newContent = resolvePropContent(input, ctx);

  try {
    return stringToExpr(newContent, scriptData.lang, filename);
  } catch {
    return t.identifier(newContent);
  }
}

/**
 * 解决各种需要特殊处理的 prop 值
 */
export function resolvePropContent(input: string, ctx: ICompilationContext): string {
  let i = input;

  if (matchEmitsMacro(i)) {
    i = resolveEmitsMacro(i);
  }
  i = resolveRefVariable(i, ctx);

  return i;
}

/**
 * 包装模板中的 ref 变量，将其还原成 varName.value 的访问形式
 */
function resolveRefVariable(input: string, ctx: ICompilationContext): string {
  const {
    templateData: { reactiveBindings },
  } = ctx;

  const addValueProperty = (input: string, varName: string): string => {
    const regex = new RegExp(`${varName}(?!\\.value)`, 'g');
    return input.replace(regex, `${varName}.value`);
  };

  for (const key in reactiveBindings) {
    const isRefBinding = reactiveBindings[key]?.reactiveType === 'ref';
    if (!isRefBinding) continue;

    input = addValueProperty(input, key);
  }

  return input;
}

/**
 * 将模板中的宏变量 $$emits 替换为 $$props，并转为 React 风格的调用。
 *
 * 例如：$$emits('click', e) => $$props?.onClick(e)
 */
function resolveEmitsMacro(input: string): string {
  const [, name, args] = matchEmitsMacro(input)!;

  const callName =
    'on' +
    name!
      .split(/[:\-]/)
      .map((part) => camelCase(capitalize(part)))
      .join('');

  const callee = args ? `${callName}(${args})` : `${callName}()`;

  return `${COMP_PROPS_NAME}?.${callee}`;
}

function matchEmitsMacro(input: string): RegExpMatchArray | null {
  return input.trim().match(EMITS_MACRO_REGEX);
}
