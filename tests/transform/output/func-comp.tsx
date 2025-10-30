//Compiled from func-comp.vue
import { useState, useMemo, useEffect, useCallback } from "react";
import { useImmer, useUpdateEffect, useMount, useUnmount } from "@eddie/react-dependencies";
export default function Demo(): React.JSX.Element {
  // ======== 响应式状态 ========
  const [count, setCount] = useState(0);
  const [user, setUser] = useImmer({
    firstName: 'Ada',
    lastName: 'Lovelace'
  });

  // ======== 计算属性 ========
  const fullName = useMemo(() => `${user.firstName} ${user.lastName}`, [user]);
  const doubleCount = useMemo(() => count * 2, [count]);

  // ======== 侦听器 ========
  // watch
  useUpdateEffect(() => {
    console.log(`[watch] count: ${oldVal} → ${newVal}`);
  }, [count]);
  // watchEffect
  useEffect(() => {
    console.log(`[watchEffect] fullName = ${fullName}`);
  }, [fullName]);

  // ======== 生命周期 ========
  // onMounted
  useMount(() => {
    console.log('[onMounted] 组件已挂载');
  });
  // onUpdated
  useUpdateEffect(() => {
    console.log('[onUpdated] 组件更新');
  }, []);
  // onUnmounted
  useUnmount(() => {
    console.log('[onUnmounted] 组件卸载');
  });

  // ======== 方法 ========
  const increment = useCallback(() => setCount(count + 1), [count]);
  const decrement = useCallback(() => setCount(count - 1), [count]);
  return <><div className="demo"><h2>🧩 Vue 3 Composition API 示例</h2><section className="counter"><h3>Counter</h3><p>Count: {count}</p><p>Double: {doubleCount}</p><button onClick={decrement}>-</button><button onClick={increment}>+</button></section><section className="user"><h3>User Info</h3><input {...{
          value: user.firstName,
          onInput: e => {
            setUser(user => e.target.value);
          }
        }} placeholder="First Name" /><input {...{
          value: user.lastName,
          onInput: e => {
            setUser(user => e.target.value);
          }
        }} placeholder="Last Name" /><p> Full name: <strong>{fullName}</strong></p></section></div></>;
}