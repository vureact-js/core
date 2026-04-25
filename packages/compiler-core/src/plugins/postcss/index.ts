/**
 * postcss scoped 插件模块 — 功能入口
 *
 * 将 Vue 风格的 scoped CSS 转换（`:deep()`、`:global()`、`:slotted()`）拆分为独立文件，
 * 降低核心文件的复杂度，便于维护和单元测试。
 *
 * 文件结构：
 *   index.ts     — 入口：processScopedWithPostCss
 *   selector.ts  — 选择器分发：resolveSelector
 *   deep.ts      — :deep() 处理：resolveDeep 及附属函数
 *   standard.ts  — 标准 scoped 重写：resolveStandard
 *   utils.ts     — 纯工具函数：findFirstPseudoIndex, hasScopeAttribute, hasNestingSelector, findScopeTargetIndex, isRuleIgnored, isNestedInRule
 */

import postcss from 'postcss';
import { resolveSelector } from './selector';
import { isRuleIgnored, isNestedInRule } from './utils';

export type { PostCssResult } from './types';

/**
 * 使用 PostCSS 处理输入的 CSS 字符串，为每条规则的选择器附加 scoped 属性。
 *
 * @param input  — 原始的 CSS 字符串
 * @param hash   — 用于生成 scoped 属性名的哈希值
 * @returns      包含处理后的 CSS 以及 scoped 属性名
 */
export function processScopedWithPostCss(input: string, hash: string): {
  css: string;
  scopeId: string;
} {
  const scopeId = `data-css-${hash}`;

  const result = postcss([
    {
      postcssPlugin: 'postcss-scoped-vureact',
      Rule(rule) {
        if (isRuleIgnored(rule)) {
          return;
        }

        rule.selectors = rule.selectors.map((selector) =>
          resolveSelector(selector, scopeId, { nestedInRule: isNestedInRule(rule) }),
        );
      },
    },
  ]).process(input);

  return {
    css: result.css,
    scopeId,
  };
}
