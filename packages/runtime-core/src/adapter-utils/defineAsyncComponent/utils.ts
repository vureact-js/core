import { AnyComponent, AsyncComponentResolveResult } from './types';

/**
 * 规范化异步解析的组件
 * 处理ES模块格式（包含default属性）和普通组件格式
 *
 * @param component 异步加载的组件结果
 * @returns 规范化后的组件
 */
export function normalizeAsyncResolvedComponent<T extends AnyComponent>(
  component: AsyncComponentResolveResult<T>,
): T {
  let resolved = component as unknown;

  // 检查是否是ES模块格式（包含default属性）
  if (
    resolved &&
    typeof resolved === 'object' &&
    'default' in (resolved as Record<string, unknown>)
  ) {
    const moduleDefault = (resolved as { default?: unknown }).default;
    if (moduleDefault != null) {
      resolved = moduleDefault;
    }
  }

  // 开发环境下检查是否解析为undefined
  if (
    // @ts-ignore
    process.env.NODE_ENV !== 'production' &&
    !resolved
  ) {
    console.warn(
      'Async component loader resolved to undefined. If you are using retry(), make sure to return its return value.',
    );
  }

  // 开发环境下检查解析结果是否有效
  if (
    // @ts-ignore
    process.env.NODE_ENV !== 'production' &&
    resolved &&
    typeof resolved !== 'function' &&
    typeof resolved !== 'object'
  ) {
    throw new Error(`Invalid async component load result: ${String(resolved)}`);
  }

  return resolved as T;
}
