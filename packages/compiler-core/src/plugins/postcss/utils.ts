import selectorParser from 'postcss-selector-parser';

// ──────────────────────────────────────────
// 选择器分析工具函数
// 用于在 AST 节点数组中找到合适的 scope 插入位置
// ──────────────────────────────────────────

/**
 * 在指定下标范围 [start, end] 内，找到第一个伪类（pseudo）节点的下标。
 * 如果没找到，返回 end + 1（表示整个范围都可作为插入 scope 的目标区间）。
 *
 * 作用：把范围缩小到「伪类之前的部分」，scope 只插在这里，不干扰 :hover、::before 等伪类。
 */
export function findFirstPseudoIndex(
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
export function hasScopeAttribute(
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

    // 如果在范围内发现已有相同的 scope 属性，说明无需重复注入
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
export function hasNestingSelector(
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
export function findScopeTargetIndex(
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
      // 记下 & 的位置作为备选
      nestingFallback = i;
      continue;
    }

    if (node?.type === 'tag' || node?.type === 'class' || node?.type === 'id') {
      // 每次遇到有效节点都更新 candidate，确保最终选到的是最靠后的那个
      candidate = i;
    }
  }

  // 没有 tag/class/id 时才回退到 & 的位置
  return candidate === -1 ? nestingFallback : candidate;
}

// ──────────────────────────────────────────
// PostCSS Rule 辅助判断
// ──────────────────────────────────────────

/**
 * 判断该 rule 是否位于 @keyframes 内部（应跳过 scoped 处理）。
 *
 * 在 @keyframes 中，选择器实际上是 0%、100% 等关键帧选择器，
 * 给它们加 scope 没有意义且会破坏动画定义。
 */
export function isRuleIgnored(rule: { parent?: { type?: string; name?: string } | null }): boolean {
  return (
    rule.parent != null &&
    rule.parent.type === 'atrule' &&
    (rule.parent as any)?.name === 'keyframes'
  );
}

/**
 * 判断该 rule 是否嵌套在另一条 rule 内部（含递归祖先检查）。
 *
 * 对于嵌套 rule（如 SCSS/Less 的 & 展开），其父选择器已经携带了 scope，
 * 在 :deep() 左侧处理时需要区分这种情况来避免重复添加 scope。
 */
export function isNestedInRule(rule: { parent?: { type?: string; parent?: any } | null }): boolean {
  let current = rule.parent as { type?: string; parent?: any } | undefined;

  while (current) {
    if (current.type === 'rule') {
      return true;
    }

    current = current.parent as { type?: string; parent?: any } | undefined;
  }

  return false;
}
