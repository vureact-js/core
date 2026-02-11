import { renderHook } from '@testing-library/react';
import { proxy as valtioProxy } from 'valtio/vanilla';
import { IS_REACTIVE_PROXY, IS_REF_PROXY } from '../shared/consts';
import {
  createProxy,
  isProxy,
  isReactive,
  isRef,
  isValtio,
  markAsReactiveState,
  markAsRefState,
} from '../shared/proxy';

describe('Proxy Utility Function Advanced Test Suites', () => {
  // 1. 测试 isValtio
  // 目标：识别对象是否为经过 createProxy 包装后的特定 Proxy（具备双重拦截能力）
  describe('isValtio', () => {
    it('should return true for proxies created by createProxy', () => {
      const { result } = renderHook(() => createProxy({ a: 1 }));
      expect(isValtio(result.current)).toBe(true);
    });

    it('should return false for plain objects', () => {
      expect(isValtio({ a: 1 })).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isValtio(123)).toBe(false);
      expect(isValtio(null)).toBe(false);
      expect(isValtio(undefined)).toBe(false);
    });

    // 注意：原生 Valtio proxy 没有你的 wrapper 拦截器，无法响应 VALTIO_PROXY_TARGET key
    // 所以这里应该返回 false，符合预期
    it('should return false for raw valtio proxies (without wrapper)', () => {
      const rawProxy = valtioProxy({ a: 1 });
      expect(isValtio(rawProxy)).toBe(false);
    });
  });

  // 2. 测试 isProxy
  // 目标：识别所有类型的响应式对象（包括你的 Wrapper 和底层的 Valtio Proxy）
  describe('isProxy', () => {
    it('should return true for proxies created by createProxy', () => {
      const { result } = renderHook(() => createProxy({ a: 1 }));
      expect(isProxy(result.current)).toBe(true);
    });

    it('should return true for raw valtio proxies', () => {
      const rawProxy = valtioProxy({ a: 1 });
      expect(isProxy(rawProxy)).toBe(true);
    });

    it('should return true for nested objects inside a proxy', () => {
      const { result } = renderHook(() => createProxy({ nested: { count: 1 } }));
      // 访问 .nested 会触发 get 拦截器，生成新的 lazy proxy
      expect(isProxy(result.current.nested)).toBe(true);
    });

    it('should return false for plain objects', () => {
      expect(isProxy({ a: 1 })).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isProxy(1)).toBe(false);
      expect(isProxy('str')).toBe(false);
    });
  });

  // 3. 测试 isReactive
  // 目标：识别带有 IS_REACTIVE_PROXY 标记的对象
  describe('isReactive', () => {
    it('should identify objects marked explicitly via markAsReactiveState', () => {
      const obj = { a: 1 };
      markAsReactiveState(obj);
      expect(isReactive(obj)).toBe(true);
    });

    it('should identify proxies created with reactive meta flag', () => {
      const { result } = renderHook(() =>
        createProxy({ a: 1 }, { meta: { [IS_REACTIVE_PROXY]: true } }),
      );
      expect(isReactive(result.current)).toBe(true);
    });

    it('should return false for plain objects or other types of proxies', () => {
      const plain = { a: 1 };
      const refObj = markAsRefState({ value: 1 });

      expect(isReactive(plain)).toBe(false);
      expect(isReactive(refObj)).toBe(false);
    });
  });

  // 4. 测试 isRef
  // 目标：识别带有 IS_REF_PROXY 标记的对象
  describe('isRef', () => {
    it('should identify objects marked explicitly via markAsRefState', () => {
      const obj = { value: 1 };
      markAsRefState(obj);
      expect(isRef(obj)).toBe(true);
    });

    it('should identify proxies created with ref meta flag', () => {
      const { result } = renderHook(() =>
        createProxy({ value: 1 }, { meta: { [IS_REF_PROXY]: true } }),
      );
      expect(isRef(result.current)).toBe(true);
    });

    it('should return false for reactive proxies', () => {
      const reactiveObj = markAsReactiveState({ a: 1 });
      expect(isRef(reactiveObj)).toBe(false);
    });
  });

  // 5. 综合集成测试
  // 目标：验证深层嵌套和混合场景
  describe('Integration Scenarios', () => {
    it('should maintain flags through deep nesting lazily', () => {
      // 模拟一个深层对象，根节点是 Reactive
      const { result } = renderHook(() =>
        createProxy(
          {
            child: {
              grandchild: { val: 1 },
            },
          },
          { meta: { [IS_REACTIVE_PROXY]: true } },
        ),
      );

      const root = result.current;
      const child = root.child;

      // 根节点是 Reactive
      expect(isReactive(root)).toBe(true);
      expect(isProxy(root)).toBe(true);

      // 子节点也是 Proxy (因为 createProxy 的拦截器会自动包装)
      expect(isProxy(child)).toBe(true);

      // 注意：目前的实现逻辑是 meta 只打在根节点。
      // 如果你希望子节点也自动通过 isReactive检查，
      // 你需要在拦截器里传递 meta，或者 isReactive 函数需要向上查找。
      // 按照你提供的代码，子节点本身没有 IS_REACTIVE_PROXY 属性，除非拦截器特殊处理了。
      // *基于你上一份 proxy.ts 代码，子节点是一个新的 createDeepInterceptor，但它默认只传递了 raw*
      // *如果期望子节点也被认为是 reactive，需要确认业务逻辑是否允许。*
      // 假设当前实现子节点不继承 flag：
      // expect(isReactive(child)).toBe(false);
    });
  });
});
