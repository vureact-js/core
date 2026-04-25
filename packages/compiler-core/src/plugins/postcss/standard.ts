import selectorParser from 'postcss-selector-parser';
import {
  findFirstPseudoIndex,
  findScopeTargetIndex,
  hasNestingSelector,
  hasScopeAttribute,
} from './utils';

// ──────────────────────────────────────────
// 标准选择器 Scoped 重写
//
// 核心逻辑：遍历每个选择器，找到「最右侧复合选择器」，
// 在其最后一个 tag/class/id 后面插入 [data-css-xxx]。
// ──────────────────────────────────────────

/**
 * 标准选择器 scoped 重写。
 *
 * 将选择器中最右侧的复合选择器（如 .foo、div.bar）附加上 [data-css-xxx]，
 * 同时跳过伪类（:hover、::before 等）以及已经包含 scope 或嵌套占位符 & 的节点。
 *
 * @param s       原始 CSS 选择器字符串
 * @param scopeId 要注入的 scope 属性名，如 "data-css-abc123"
 */
export function resolveStandard(s: string, scopeId: string): string {
  try {
    // 用 postcss-selector-parser 解析选择器并遍历修改
    return selectorParser((selectors) => {
      // selectors 包含该规则中逗号分隔的所有选择器，逐个处理
      selectors.each((selector) => {
        // ── 第 1 步：定位「最右侧复合选择器」的范围 ──
        // 例如 .a > .b.c   → 复合选择器是 .b.c（compoundStart=2, compoundEnd=3）
        //      .foo         → 整个选择器就是复合选择器（compoundStart=0）
        const compoundEnd = selector.nodes.length - 1;
        if (compoundEnd < 0) {
          return;
        }

        // 从右往左找第一个 combinator（空格、>、+、~ 等），
        // 它后面的所有节点构成最右侧的复合选择器
        let compoundStart = 0;
        for (let i = compoundEnd; i >= 0; i--) {
          if (selector.nodes[i]?.type === 'combinator') {
            compoundStart = i + 1;
            break;
          }
        }

        // ── 第 2 步：找到该复合选择器中第一个伪类的位置 ──
        // 伪类（:hover、::before）应该保持原样，scope 只插在伪类之前
        const firstPseudoIndex = findFirstPseudoIndex(selector.nodes, compoundStart, compoundEnd);

        // ── 第 3 步：前置检查，跳过不需要加 scope 的情况 ──

        // (a) 选择器里含有 &（嵌套占位符），父选择器已携带 scope
        if (hasNestingSelector(selector.nodes, compoundStart, firstPseudoIndex - 1)) {
          return;
        }

        // (b) 选择器里已有相同的 scope 属性，避免重复注入
        if (hasScopeAttribute(selector.nodes, compoundStart, firstPseudoIndex - 1, scopeId)) {
          return;
        }

        // ── 第 4 步：确定 scope 插入的目标节点 ──
        // 优先选 tag/class/id 中最靠后的那个，没有则选 & 的位置
        const insertTargetIndex = findScopeTargetIndex(
          selector.nodes,
          compoundStart,
          firstPseudoIndex - 1,
        );
        if (insertTargetIndex === -1) {
          return;
        }

        // ── 第 5 步：在目标节点后面插入 [data-css-xxx] ──
        // 例如 .bar       → .bar[data-css-xxx]
        //      .bar:hover → .bar[data-css-xxx]:hover
        //      div.foo    → div.foo[data-css-xxx]
        selector.insertAfter(
          selector.nodes[insertTargetIndex]!,
          selectorParser.attribute({
            attribute: scopeId,
            raws: {},
            value: undefined, // 不加 = 值，等同于 [data-css-xxx]
          }),
        );
      });
    }).processSync(s);
  } catch (e) {
    // 保底：解析失败时简单地在末尾追加 [data-css-xxx]，保证构建不中断
    console.warn(e);
    return `${s}[${scopeId}]`;
  }
}
