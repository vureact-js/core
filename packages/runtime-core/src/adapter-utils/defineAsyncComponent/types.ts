import { type ComponentType } from 'react';

/**
 * 通用组件类型定义，可以是任何React组件
 */
export type AnyComponent = ComponentType<any>;

/**
 * 通用属性类型定义，可以是任何对象
 */
export type AnyProps = Record<string, any>;

/**
 * 异步组件解析结果类型
 * 可以是组件本身，或者是包含default属性的对象（ES模块格式）
 */
export type AsyncComponentResolveResult<T = AnyComponent> = T | { default: T };

/**
 * 异步组件加载器函数类型
 * 返回一个Promise，解析为AsyncComponentResolveResult
 */
export type AsyncComponentLoader<T = AnyComponent> = () => Promise<AsyncComponentResolveResult<T>>;

/**
 * 水合策略类型（当前在React运行时中未实现）
 */
export type HydrationStrategy = (...args: any[]) => any;

/**
 * 异步组件配置选项接口
 */
export interface AsyncComponentOptions<T = AnyComponent> {
  /** 异步加载组件的函数 */
  loader: AsyncComponentLoader<T>;
  /** 加载中显示的组件 */
  loadingComponent?: ComponentType<any>;
  /** 加载错误时显示的组件 */
  errorComponent?: ComponentType<{ error: Error }>;
  /** 延迟显示加载组件的时间（毫秒） */
  delay?: number;
  /** 加载超时时间（毫秒） */
  timeout?: number;
  /** 是否可挂起（使用React Suspense） */
  suspensible?: boolean;
  /** 水合策略（当前未实现） */
  hydrate?: HydrationStrategy;
  /** 错误处理回调函数 */
  onError?: (error: Error, retry: () => void, fail: () => void, attempts: number) => any;
}
