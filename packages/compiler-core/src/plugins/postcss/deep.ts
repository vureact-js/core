import selectorParser from 'postcss-selector-parser';
import { resolveStandard } from './standard';
import { findFirstPseudoIndex, findScopeTargetIndex, hasScopeAttribute } from './utils';

// ──────────────────────────────────────────
// :deep() 选择器处理
//
// :deep() 是 Vue scoped CSS 中的「样式穿透」语法，用于让 scoped 样式
// 能够影响子组件内部的元素。处理策略：
//   1. 将 :deep(...) 左侧的部分加上 scope（如 .foo:deep(.bar) → .foo[data-css-x] .bar）
//   2. :deep(...) 内部的选择器保持原样，不做 scoped 处理
//   3. 支持多个 :deep() 嵌套或连续出现
// ──────────────────────────────────────────

/**
 * 处理 :deep(...) 选择器。
 * 将 :deep(...) 左侧的部分添加 scoped 属性，右侧（:deep 内部的选择器）保持不变，
 * 从而实现穿透 scoped 样式的能力。
 *
 * @param s            原始 CSS 选择器字符串
 * @param scopeId      要注入的 scope 属性名
 * @param nestedInRule 是否嵌套在另一条 rule 中
 */
export function resolveDeep(s: string, scopeId: string, nestedInRule: boolean): string {
  try {
    // 先解析整个选择器 AST
    const root = selectorParser().astSync(s);
    const resolvedSelectors: string[] = [];

    // 遍历逗号分隔的每个选择器
    root.nodes.forEach((selector) => {
      const resolved = resolveSingleSelectorWithDeep(selector, scopeId, nestedInRule);
      resolvedSelectors.push(...resolved);
    });

    // 用逗号重新拼接
    return resolvedSelectors.join(', ');
  } catch (e) {
    console.warn(e);
    // fallback：至少把 :deep(...) 解包，保证输出 CSS 语法正确
    return s.replace(/:deep\((.*)\)/g, '$1');
  }
}

/**
 * 处理单个选择器中的 :deep(...)。
 *
 * 策略：将选择器按 :deep(...) 的位置分为左、中、右三部分：
 *   - 左 (.a .b :deep(.c .d) .e)
 *     切割后 → 左: ".a .b "，中: ".c .d"，右: " .e"
 *   - 左部分加 scope，中右部分保持原样
 *
 * @returns 可能返回多个选择器（如 :deep() 内含逗号选择器时展开）
 */
function resolveSingleSelectorWithDeep(
  selector: selectorParser.Selector,
  scopeId: string,
  nestedInRule: boolean,
): string[] {
  // 查找顶层（非嵌套在括号内的）:deep 位置
  const deepIndex = findTopLevelDeepIndex(selector.nodes);

  // 如果没有 :deep()，退化为标准 scoped 处理
  if (deepIndex === -1) {
    return [resolveStandard(selector.toString(), scopeId)];
  }

  const deepNode = selector.nodes[deepIndex];
  if (deepNode?.type !== 'pseudo') {
    return [resolveStandard(selector.toString(), scopeId)];
  }

  // 分割选择器：取 :deep 节点前后的所有文本
  const leftRaw = selector.nodes
    .slice(0, deepIndex)
    .map((node) => node.toString())
    .join('');

  const rightRaw = selector.nodes
    .slice(deepIndex + 1)
    .map((node) => node.toString())
    .join('');

  // 对左侧部分做 scoped 处理
  const leftScoped = scopeDeepLeftSide(leftRaw, scopeId, nestedInRule);

  // 取 :deep(...) 括号内的选择器列表
  const deepInnerSelectors = deepNode.nodes?.length ? deepNode.nodes : [];

  if (!deepInnerSelectors.length) {
    // :deep() 括号内为空，只返回左侧 + 右侧
    return [leftScoped + rightRaw];
  }

  // 将左、中、右拼接起来
  // :deep() 里可能有多个逗号分隔的选择器，需要逐个展开
  const results: string[] = [];
  for (const innerSelector of deepInnerSelectors) {
    const combined = joinDeepParts(leftScoped, innerSelector.toString().trim(), rightRaw);

    // 如果拼接结果中还包含 :deep()（嵌套场景），递归处理
    if (combined.includes(':deep(')) {
      results.push(resolveDeep(combined, scopeId, nestedInRule));
      continue;
    }

    results.push(combined);
  }

  return results;
}

/**
 * 在 selector.nodes 中查找第一个顶层（非嵌套）的 :deep 或 ::v-deep 伪类。
 * @returns 找到的下标，未找到返回 -1
 */
function findTopLevelDeepIndex(nodes: selectorParser.Selector['nodes']): number {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node?.type === 'pseudo' && (node.value === ':deep' || node.value === '::v-deep')) {
      return i;
    }
  }

  return -1;
}

/**
 * 对 :deep() 左侧的选择器部分应用 scoped 处理。
 *
 * 特殊逻辑：
 *   - 左侧为空时，如果是嵌套 rule 则返回 &（继承父选择器），否则直接返回 [scopeId]
 *   - 左侧不为空时，在其最右侧复合选择器上注入 [data-css-xxx]
 */
function scopeDeepLeftSide(leftRaw: string, scopeId: string, nestedInRule: boolean): string {
  if (!leftRaw.trim()) {
    // 左侧为空：嵌套规则用 & 占位，非嵌套直接用 [scopeId] 作为选择器
    return nestedInRule ? '&' : `[${scopeId}]`;
  }

  try {
    const root = selectorParser().astSync(leftRaw);
    root.each((selector) => {
      injectScopeToRightMostCompound(selector, scopeId);
    });
    return root.toString();
  } catch (e) {
    console.warn(e);
    return resolveStandard(leftRaw, scopeId);
  }
}

/**
 * 在 selector 的「最右侧复合选择器」上注入 [data-css-xxx]。
 *
 * 与标准 scoped 不同之处：
 *   这里用于 :deep() 的左侧部分，需要额外处理尾部 combinator 的情况。
 *   例如 " .a > " 中的尾部 combinator ">" 应该被忽略，scope 应加在 .a 上。
 */
function injectScopeToRightMostCompound(selector: selectorParser.Selector, scopeId: string) {
  const nodes = selector.nodes;
  if (!nodes.length) {
    return;
  }

  // 从右往左跳过尾部的 combinator（空格、>、+、~ 等），找到真正的复合选择器末端
  let compoundEnd = nodes.length - 1;
  while (compoundEnd >= 0 && nodes[compoundEnd]?.type === 'combinator') {
    compoundEnd--;
  }

  if (compoundEnd < 0) {
    return;
  }

  // 再从右往左找到 combinator 边界，确定复合选择器的起始位置
  let compoundStart = 0;
  for (let i = compoundEnd; i >= 0; i--) {
    if (nodes[i]?.type === 'combinator') {
      compoundStart = i + 1;
      break;
    }
  }

  // 定位到伪类之前，检查是否已有 scope，找到插入目标
  const firstPseudoIndex = findFirstPseudoIndex(nodes, compoundStart, compoundEnd);
  if (hasScopeAttribute(nodes, compoundStart, firstPseudoIndex - 1, scopeId)) {
    return;
  }

  const insertTargetIndex = findScopeTargetIndex(nodes, compoundStart, firstPseudoIndex - 1);
  if (insertTargetIndex === -1) {
    return;
  }

  // 清除目标节点尾部空格，使 [data-css-xxx] 紧贴节点
  const insertTarget = nodes[insertTargetIndex]!;
  insertTarget.spaces = {
    ...insertTarget.spaces,
    after: '',
  };

  // 在目标节点后插入 [data-css-xxx]
  selector.insertAfter(
    insertTarget,
    selectorParser.attribute({
      attribute: scopeId,
      raws: {},
      value: undefined,
    }),
  );
}

/**
 * 将 :deep() 的左、中、右三部分拼接成一个完整的选择器字符串。
 *
 * 自动判断是否需要插入空格，避免出现 .foo.bar（缺少空格）或 .foo   .bar（多余空格）。
 *
 * @param leftScoped 已加 scope 的左侧部分
 * @param innerRaw   :deep() 内部的选择器
 * @param rightRaw   :deep() 右侧的部分
 * @returns 拼接后的选择器字符串
 */
function joinDeepParts(leftScoped: string, innerRaw: string, rightRaw: string): string {
  if (!leftScoped) {
    return `${innerRaw}${rightRaw}`;
  }

  // 如果左侧不以空格结尾，需要加个空格再拼 inner
  const needsGap = !/\s$/.test(leftScoped);
  const gap = needsGap ? ' ' : '';

  return `${leftScoped}${gap}${innerRaw}${rightRaw}`;
}
