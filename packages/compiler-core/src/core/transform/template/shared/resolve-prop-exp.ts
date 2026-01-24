import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { styleModule } from '@consts/other';
import { RuntimeModules, VuR_Runtime } from '@consts/runtimeModules';
import { recordImport } from '../../shared/setup-runtime-utils';
import { PropsIR, PropTypes } from '../props';
import { isClassAttr, isStyleAttr } from '../props/utils';
import { isSimpleStyle } from './parse-style-string';
import { resolveTemplateExp } from './resolve-str-exp';
import { wrapSingleQuotes } from './utils';

export function resolvePropAsBabelExp(ctx: ICompilationContext, propIR: PropsIR) {
  const name = propIR.name;
  const nameExp = propIR.babelExp;
  const value = propIR.value;
  const valueContent = value.content;
  const mergeItem = value.merge;

  const setNameIdentifier = (ne: typeof nameExp, nm: string) => {
    ne.content = nm;
    ne.ast = t.jsxIdentifier(nm);
  };

  const setValueExp = (ve: typeof value.babelExp, content: string, isStringLiteral?: boolean) => {
    ve.content = content;
    ve.ast = resolveTemplateExp(ctx, content, isStringLiteral);
  };

  const makeCall = (fn: string, args: Array<string | undefined | null>) => {
    const fnArgs = args.filter(Boolean).join(',');
    return `${fn}(${fnArgs})`;
  };

  const applyRuntime = (
    content: string,
    setName = false,
    nm?: string,
    isStringLiteral?: boolean,
  ) => {
    if (setName && nm) setNameIdentifier(nameExp, nm);
    setValueExp(value.babelExp, content, isStringLiteral);
    recordImport(ctx, RuntimeModules.VUREACT_RUNTIME, VuR_Runtime.dir, true);
  };

  if (propIR.isKeyLessVBind) {
    const newContent = makeCall(VuR_Runtime.dirKeyless, [valueContent]);
    applyRuntime(newContent, false);
    return;
  }

  if (isClassAttr(name) && !value.isStringLiteral && !valueContent.startsWith(styleModule)) {
    const arg = mergeItem?.join(',') || wrapSingleQuotes(valueContent);
    const newContent = makeCall(VuR_Runtime.dirCls, [arg]);

    applyRuntime(newContent, true, name);

    return;
  }

  if (
    isStyleAttr(name) &&
    (!isSimpleStyle(valueContent) || mergeItem?.some((m) => !isSimpleStyle(m)))
  ) {
    const arg = mergeItem?.join(',') || valueContent;
    const newContent = makeCall(VuR_Runtime.dirStyle, [arg]);

    applyRuntime(newContent, true, name);

    return;
  }

  if (propIR.type === PropTypes.EVENT && propIR.modifiers?.length) {
    // 临时字段 __vOnEvName 存储了原始的 vue 事件名
    const event = wrapSingleQuotes((propIR as any).__vOnEvName || name, propIR.isStatic);
    const handler = valueContent;
    const newContent = makeCall(VuR_Runtime.dirOn, [event, handler]);

    applyRuntime(newContent, true, name);

    return;
  }

  if (!propIR.isStatic) {
    const tpl = `{[${name}]:${valueContent}}`;
    nameExp.content = tpl;
    nameExp.ast = resolveTemplateExp(ctx, tpl);
  } else {
    setNameIdentifier(nameExp, name);
    setValueExp(value.babelExp, valueContent, value.isStringLiteral);
  }
}
