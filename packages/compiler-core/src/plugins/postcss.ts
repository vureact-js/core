import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

type PostCssResult = {
  css: string;
  scopeId: string;
};

export function processScopedWithPostCss(input: string, hash: string): PostCssResult {
  const scopeId = `data-css-${hash}`;

  // 同步处理 css
  const result = postcss([
    {
      postcssPlugin: 'postcss-scoped-vureact',
      Rule(rule) {
        if (isRuleIgnored(rule)) {
          return;
        }

        rule.selectors = rule.selectors.map((selector) => resolveSelector(selector, scopeId));
      },
    },
  ]).process(input);

  return {
    css: result.css,
    scopeId,
  };
}

function isRuleIgnored(rule: postcss.Rule) {
  // ignore rules inside @keyframes
  return rule.parent && rule.parent.type === 'atrule' && (rule.parent as any)?.name === 'keyframes';
}

function resolveSelector(s: string, scopeId: string): string {
  // 1) :global(...)
  // feature: https://github.com/vureact-js/core/issues/22
  if (s.includes(':global(')) {
    return s.replace(/:global\(([^)]+)\)/g, (_, inner) => inner);
  }

  // 2) :deep(...)
  // feature: https://github.com/vureact-js/core/issues/22
  if (s.includes(':deep(')) {
    return s.replace(/:deep\((.*)\)/, '$1');
  }

  // 3) :slotted(...)
  if (s.includes(':slotted(')) {
    // todo
    return s.replace(/:slotted\((.*)\)/, '$1');
  }

  // 4) standard selector rewrite
  // fix: https://github.com/vureact-js/core/issues/23
  return resolveStandard(s, scopeId);
}

function resolveStandard(s: string, scopeId: string): string {
  try {
    return selectorParser((selectors) => {
      // selectors = 这条规则可能包含多个选择器（逗号分隔），逐一处理
      selectors.each((selector) => {
        // ── 步骤1：确定「最右侧复合选择器」的起止下标 ──
        // compoundEnd = 选择器最末尾节点的下标
        const compoundEnd = selector.nodes.length - 1;
        if (compoundEnd < 0) {
          return;
        }

        // 从右往左找第一个 combinator（空格、>、+、~ 等），
        // 后面的部分就是最右侧复合选择器。
        // 例如：.a > .b.c   → combinator 是 >，compoundStart 指向 .b
        //         .a .b      → combinator 是空格，compoundStart 指向 .b
        //         .foo       → 找不到 combinator，compoundStart = 0
        let compoundStart = 0;
        for (let i = compoundEnd; i >= 0; i--) {
          if (selector.nodes[i]?.type === 'combinator') {
            compoundStart = i + 1;
            break;
          }
        }

        // ── 步骤2：找到该复合选择器范围内的第一个伪类（pseudo）下标 ──
        // 伪类（如 :hover、::before）应该保持原样不插入 scope，
        // 所以我们要把 scope 插在「实际元素/类/id」和「伪类」之间。
        const firstPseudoIndex = findFirstPseudoIndex(selector.nodes, compoundStart, compoundEnd);

        // ── 步骤3：前置检查，跳过不需要加 scope 的情况 ──

        // (a) 最右侧复合选择器里含有 &（嵌套占位符）
        //     说明父选择器已经携带了 scope，这里无需重复加
        if (hasNestingSelector(selector.nodes, compoundStart, firstPseudoIndex - 1)) {
          return;
        }

        // (b) 最右侧复合选择器里已经存在相同的 data-css-xxx
        //     避免重复注入导致 [data-css-a][data-css-a] 这样的情况
        if (hasScopeAttribute(selector.nodes, compoundStart, firstPseudoIndex - 1, scopeId)) {
          return;
        }

        // ── 步骤4：确定要在哪个节点后面插入 [data-css-xxx] ──
        // 优先级：tag/class/id > 嵌套占位符 &
        //         → 选择最后一个符合条件的节点，确保 scope 插在最合适的位置
        const insertTargetIndex = findScopeTargetIndex(
          selector.nodes,
          compoundStart,
          firstPseudoIndex - 1, // 只在伪类之前的部分里找插入点
        );
        if (insertTargetIndex === -1) {
          return;
        }

        // ── 步骤5：在目标节点后面插入属性选择器 [data-css-xxx] ──
        // 例如 .bar → .bar[data-css-xxx]
        //       .bar:hover → .bar[data-css-xxx]:hover（插在 :hover 前面）
        selector.insertAfter(
          selector.nodes[insertTargetIndex]!,
          selectorParser.attribute({
            attribute: scopeId,
            raws: {},
            value: undefined, // 不指定值，效果等同于 [data-css-xxx]
          }),
        );
      });
    }).processSync(s);
  } catch (e) {
    // 保底：如果 postcss-selector-parser 解析失败（比如遇到它不认识的古怪语法），
    // 直接在整个选择器后面追加 [data-css-xxx]，保证构建不中断
    console.warn(e);
    return `${s}[${scopeId}]`;
  }
}

/**
 * 在指定下标范围 [start, end] 内，找到第一个伪类（pseudo）节点的下标。
 * 如果没找到，返回 end + 1（表示整个范围都可作为插入 scope 的目标区间）。
 *
 * 作用：把范围缩小到「伪类之前的部分」，scope 只插在这里，不干扰 :hover、::before 等伪类。
 */
function findFirstPseudoIndex(
  nodes: selectorParser.Selector['nodes'],
  start: number,
  end: number,
): number {
  for (let i = start; i <= end; i++) {
    if (nodes[i]?.type === 'pseudo') {
      return i;
    }
  }

  return end + 1;
}

/**
 * 检查 [start, end] 范围内是否已经存在属性选择器 attribute === scopeId。
 * 用于防止重复注入，例如用户自己写了 [data-css-xxx] 就不用再加了。
 */
function hasScopeAttribute(
  nodes: selectorParser.Selector['nodes'],
  start: number,
  end: number,
  scopeId: string,
): boolean {
  if (start > end) {
    return false;
  }

  for (let i = start; i <= end; i++) {
    const node = nodes[i];

    // 防止重复注入
    if (node?.type === 'attribute' && node.attribute === scopeId) {
      return true;
    }
  }

  return false;
}

/**
 * 检查 [start, end] 范围内是否含有嵌套选择器 &（nesting 类型）。
 * 如果有 &，说明这个选择器是嵌套在父选择器里的（如 SCSS/Less 的 &），
 * 父选择器已经携带了 scope，子选择器不需要重复加。
 */
function hasNestingSelector(
  nodes: selectorParser.Selector['nodes'],
  start: number,
  end: number,
): boolean {
  if (start > end) {
    return false;
  }

  for (let i = start; i <= end; i++) {
    if (nodes[i]?.type === 'nesting') {
      return true;
    }
  }

  return false;
}

/**
 * 在 [start, end] 范围内，找到最合适的 scope 插入目标节点下标。
 *
 * 选择优先级（从高到低）：
 *   1. tag（如 div、span） > class（.foo） > id（#bar） → 取位置最靠后的那个
 *   2. 如果上面都没有，就用 nesting 占位符 & 的位置
 *   3. 都没有则返回 -1（跳过）
 *
 * 为什么要取「最后一个」符合条件的节点？
 *  → 例如 .foo.bar，scope 插在 .bar 后面变成 .foo.bar[data-css-xxx]，
 *      如果插在 .foo 后面变成 .foo[data-css-xxx].bar，语义不同且不美观。
 */
function findScopeTargetIndex(
  nodes: selectorParser.Selector['nodes'],
  start: number,
  end: number,
): number {
  if (start > end) {
    return -1;
  }

  let candidate = -1;
  let nestingFallback = -1;

  for (let i = start; i <= end; i++) {
    const node = nodes[i];

    if (node?.type === 'nesting') {
      nestingFallback = i;
      continue;
    }

    if (node?.type === 'tag' || node?.type === 'class' || node?.type === 'id') {
      candidate = i;
    }
  }

  return candidate === -1 ? nestingFallback : candidate;
}