import { useMemo, useCallback, memo } from 'react';
import { useVRef, useReactive } from '@vureact/runtime-core';
import { log } from 'console';
const Input = memo(() => {
  const fooRef = useVRef(0);
  const reactiveState = useReactive({
    foo: 'bar',
    bar: {
      c: 1
    }
  });

  // obj 应被优化成 useMemo 调用
  const memoizedObj = useMemo(() => ({
    title: 'test',
    bar: fooRef.value,
    add: () => {
      reactiveState.bar.c++;
    }
  }), [fooRef.value, reactiveState.bar?.c]);

  // 应忽略处理
  let staticObj = {
    foo: 1,
    state: {
      bar: {
        c: 1
      }
    }
  };
  const reactiveList = useMemo(() => [fooRef.value, 1, 2], [fooRef.value]);

  // 应忽略处理
  const staticList = [1, 2, 3];
  const mixedList = useMemo(() => [{
    name: reactiveState.foo,
    age: fooRef.value
  }, {
    name: 'A',
    age: 20
  }], [reactiveState.foo, fooRef.value]);

  // 应被优化
  const nestedObj = useMemo(() => ({
    a: {
      b: {
        c: reactiveList[0],
        // list[0] 是响应式的，应被收集
        d: () => {
          return memoizedObj.bar; // 应被收集
        }
      },
      e: mixedList // 引用整个数组，但数组中包含有响应式值，应被收集
    }
  }), [reactiveList[0], memoizedObj.bar, mixedList]);
  const computeFn = useCallback(() => {
    memoizedObj.add();
    return nestedObj.a.b.d();
  }, [memoizedObj, nestedObj.a?.b]);
  const formattedValue = useMemo(() => memoizedObj.bar.toFixed(2), [memoizedObj.bar]);
  return <><button onClick={log} /><button onClick={() => {
      log(1);
    }} /><button onClick={() => {
      fooRef.value++;
    }} /><button onClick={() => {
      memoizedObj.bar + 1;
    }} /><button onClick={() => {
      memoizedObj.bar = 1;
    }} /><button onClick={memoizedObj.add} /><button onClick={e => console.log(e)} /></>;
});
export default Input;