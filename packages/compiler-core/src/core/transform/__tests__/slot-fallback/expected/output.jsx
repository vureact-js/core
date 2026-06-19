import { memo } from 'react';
const Input = memo(() => {
  return <>{props.children ?? <><div>默认内容</div><div>我测</div></>}<button type='submit'>{props.submitText ?? "Submit"}</button>{/* 顺便测一下动态插槽名 */}<BaseLayout {...{
      [dynamicSlotName]: '...'
    }} {...{
      [dynamicName]: '...'
    }}>{/* 缩写为 */}</BaseLayout></>;
});
export default Input;