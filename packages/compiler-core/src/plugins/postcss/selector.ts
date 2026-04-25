import { resolveDeep } from './deep';
import { resolveStandard } from './standard';

// ──────────────────────────────────────────
// 选择器分发
//
// 根据选择器中包含的特殊 CSS 伪类关键字，路由到不同的处理函数：
//   :global()   → 移除包装，保持全局
//   :deep()     → 样式穿透，保留内部选择器
//   :slotted()  → 插槽样式（WIP）
//   其他         → 标准 scoped 注入
// ──────────────────────────────────────────

/**
 * 顶级选择器分发入口。
 *
 * 根据选择器包含的特殊关键字，路由到不同的处理逻辑：
 *   1. `:global(...)` — 移除该包装，内容保持全局样式
 *   2. `:deep(...)` — 处理样式穿透
 *   3. `:slotted(...)` — 处理插槽样式（当前暂为简单替换）
 *   4. 其他标准选择器 — 添加 scoped 属性
 *
 * @param s             原始选择器字符串
 * @param scopeId       当前组件作用域 ID
 * @param options       可选的上下文配置
 * @param options.nestedInRule  是否嵌套在另一条 rule 内部
 * @returns 处理后的选择器字符串
 */
export function resolveSelector(
  s: string,
  scopeId: string,
  options?: { nestedInRule?: boolean },
): string {
  // 1) :global(...) — 移除 :global() 包装，保留内部选择器作为全局样式
  if (s.includes(':global(')) {
    // feature: https://github.com/vureact-js/core/issues/22
    return s.replace(/:global\(([^)]+)\)/g, (_, inner) => inner);
  }

  // 2) :deep(...) — 样式穿透，左侧加 scope，内部选择器保持原样
  if (s.includes(':deep(')) {
    // feature: https://github.com/vureact-js/core/issues/22
    return resolveDeep(s, scopeId, options?.nestedInRule ?? false);
  }

  // 3) :slotted(...) — 插槽样式（暂未实现完整逻辑，仅解包）
  if (s.includes(':slotted(')) {
    // todo: 实现完整的 :slotted() 处理逻辑
    return s.replace(/:slotted\((.*)\)/, '$1');
  }

  // 4) 默认：标准 scoped 重写，在最后的选择器上追加 [data-css-xxx]
  // fix: https://github.com/vureact-js/core/issues/23
  return resolveStandard(s, scopeId);
}
