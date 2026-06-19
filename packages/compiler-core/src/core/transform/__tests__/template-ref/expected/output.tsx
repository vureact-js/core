import { useRef, memo } from 'react';
import { useVRef, useMounted } from '@vureact/runtime-core';
const Input = memo(() => {
  // 1.应将 useTemplateRef 替换成 useRef
  // 2.应将 useRef 的值替换成 null
  // 3.应为 useRef 推导出对应 HTML 类型接口
  // 4.应将 useTemplateRef 的 .value 属性替换为 .current
  // 5.应将模板中的 ref 字符串值替换为对应的 useRef 变量访问
  // 6.应将模板中的 :ref 表达式内容，将 ref() 变量加上 .value 后缀，useRef 变量加上 .current

  const pRef = useRef<HTMLParagraphElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const spanRef = useVRef();
  const funck = useRef<any>(null);
  const count = useVRef(1);
  useMounted(() => {
    const divEl = divRef.current;
    if (divEl && pRef.current) {
      divEl.className = 'div';
      pRef.current.style.background = 'red';
    }
  });
  spanRef.value?.xxxx;

  // 假设在 Child 组件中暴露了 Ref 引用对象 count
  // const count = ref(0);
  // defineExpose({ count })
  // 访问 count 时需要使用 .value 访问
  funck.current?.count.value;
  count.value++;
  return <><p ref={pRef}>hello</p><div ref={divRef}>vureact</div><span ref={el => spanRef.value = el}>Abc</span><Child ref={funck} /></>;
});
export default Input;