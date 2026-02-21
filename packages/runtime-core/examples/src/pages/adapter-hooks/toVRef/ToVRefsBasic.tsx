import { useReactive, useToVRefs } from '../../../../../src';

export const ToVRefsBasic = () => {
  const state = useReactive({
    foo: 1,
    bar: 'Hello',
  });

  // 使用 useToVRefs 转换后，可以安全地进行结构
  // 此时 foo 是 { value: number }, bar 是 { value: string }
  const { foo, bar } = useToVRefs(state);

  return (
    <div className="m-example-container">
      <h3>2. useToVRefs 示例</h3>
      <div className="card">
        <p>Foo (Ref): {foo.value}</p>
        <p>Bar (Ref): {bar.value}</p>

        <div className="button-group">
          <button onClick={() => foo.value++}>修改解构后的 Foo</button>
          <button onClick={() => (bar.value += '!')}>修改解构后的 Bar</button>
        </div>
      </div>
    </div>
  );
};
