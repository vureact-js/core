import { useCallback, memo } from 'react';
import { useVRef, useComputed, useMounted } from '@vureact/runtime-core';
import $style from './input-70e40ed6.module.css';
const Input = memo(() => {
  const count = useVRef<number>(0);
  const name = useVRef('Vue 3');
  const greetingMessage = useComputed(() => {
    return `你好，欢迎来到 ${name.value} 的世界!`;
  });
  const increment = useCallback(() => {
    count.value++;
  }, [count.value]);
  useMounted(() => {
    console.log('组件已挂载！');
  });
  return <><div className='hello-container' data-css-70e40ed6><h1 data-css-70e40ed6>{greetingMessage.value}</h1><p data-css-70e40ed6>计数器: **{count.value}**</p><button onClick={increment} data-css-70e40ed6>点击我增加计数</button></div></>;
});
export default Input;