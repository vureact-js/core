import { useMemo, useCallback, memo } from 'react';
import { useVRef, useReactive } from '@vureact/runtime-core';
const Input = memo(() => {
  const count = useVRef(0);
  const foo = useVRef(0);
  const state = useReactive({
    foo: 'bar',
    bar: {
      c: 1
    }
  });

  // 应分析箭头函数中的依赖并转成 useCallback
  const fn1 = useCallback(() => {
    count.value += state.bar.c;
    console.log(count.value);
  }, [count.value, state.bar?.c]);

  // 应被忽略
  const fn = () => {};

  // 应分析
  const fn2 = useCallback(() => {
    // 应溯源，并收集 foo.value
    const c = foo.value;
    fn();
    // 应忽略局部箭头函数
    const fn4 = () => {
      state.bar.c--;
      c + count.value;
    };
  }, [foo.value, state.bar?.c, count.value]);

  // 应分析
  const fn3 = useCallback(() => {
    foo.value++;

    // 应忽略函数内部的创建的响应式变量
    const state = useVRef('fake');

    // 应忽略与外部响应式变量 count 同名的
    const count = state.value + 'yoxi';
    count.charAt(1);
  }, [foo.value]);

  // 普通函数应忽略
  function fn4() {
    const t = state.foo;

    // 应忽略
    return () => {
      state.foo = 'barr';
    };
  }

  // @ts-ignore
  callback(() => {
    // 回调函数应忽略
    count.value++;
  });

  // 类/普通对象的方法成员应忽略
  class Foo {
    bar = () => {
      count.value;
    };
  }
  const methods = useMemo(() => ({
    fn: () => {
      state.foo;
      const fn = () => {
        foo.value;
      };
    }
  }), [state.foo, foo.value]);
  const objRef = useVRef({
    a: 1,
    b: {
      c: 1
    }
  });
  const listRef = useVRef([1, 2, 3]);
  const chainFn = useCallback(() => {
    state.foo;
    count.value;
    objRef.value.a;
  }, [state.foo, count.value, objRef.value?.a]);
  const dynamicFn = useCallback(() => {
    // @ts-ignore
    state[Date.now()];
    // @ts-ignore
    foo?.[count.value];
    objRef.value.b.c;
  }, [state, foo, count.value, objRef.value?.b?.c]);
  const aliasA = useMemo(() => state.foo, [state.foo]);
  const aliasB = useMemo(() => aliasA, [aliasA]);
  const aliasC = useMemo(() => aliasB, [aliasB]);

  // 应分析并溯源 aliasC，最终收集 state.foo
  const traceFn = useCallback(() => {
    aliasC;
  }, [aliasC]);
  const {
    foo: stateFoo
  } = useMemo(() => state, [state]);
  const [first] = useMemo(() => listRef.value, [listRef.value]);

  // 应分析
  const destructureFn = useCallback(() => {
    stateFoo; // 溯源并收集到 state
    first; // 溯源并收集到 listRef.value
  }, [stateFoo, first]);
  const bad = Date.now() + 1;
  // 应忽略
  const badFn = () => {
    bad;
  };
  return null;
});
export default Input;