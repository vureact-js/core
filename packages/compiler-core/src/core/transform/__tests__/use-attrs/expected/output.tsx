// @ts-nocheck
import { useMemo, memo } from 'react';
import { dir } from '@vureact/runtime-core';
/**
 * Vue 组件
 */

// 来自 xx
// AAA
import { A } from 'Aa';
/* B 组件 */
import { B } from 'Bb';
/**
 * 透传属性接口
 */
interface Attrs {
  class?: string;
  style?: string;
}
export type ICompProps = {
  title: string;
  class: string;
};
const Input = memo((props: ICompProps & Record<string, unknown>) => {
  const attrs = useMemo(() => props as Record<string, unknown>, [props]);

  // 解构 useAttrs + 类型断言
  const {
    style,
    class: cls
  } = useMemo(() => props as Attrs, [props]);

  // 带类型注解
  const destructured = useMemo(() => props as Attrs, [props]);
  void A;
  void B;
  if (attrs?.class || props.class) {
    const cls = attrs.class + 'red';
    console.log(attrs.class, cls, props.class);
  }
  return <><div className={dir.cls(['red', attrs.class, attrs.xx.class, attrs['class'], attrs.xx['class'], attrs?.['class']])}>{attrs?.xxx?.['class']}</div>{attrs?.class ? <span className={dir.cls(attrs.class)}>{attrs?.xxx?.class}</span> : null}{source.map(value => <div key={value}>{value}</div>)}<template>dawdw</template></>;
});
export default Input;