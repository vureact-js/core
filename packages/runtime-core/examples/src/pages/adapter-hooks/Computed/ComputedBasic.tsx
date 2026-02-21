import { useComputed, useReactive } from '../../../../../src';

export const ComputedBasic = () => {
  const state = useReactive({
    count: 1,
    price: 99,
  });

  // 自动追踪 state.count 和 state.price
  const totalPrice = useComputed(() => {
    console.log('计算总价中...'); // 只有依赖变了才会打印
    return state.count * state.price;
  });

  return (
    <div className="i-example-container">
      <h3>1. 基础计算属性</h3>
      <div className="card">
        <p>单价: ¥{state.price}</p>
        <p>数量: {state.count}</p>
        <p className="highlight">总价 (Computed): ¥{totalPrice.value}</p>

        <div className="button-group">
          <button onClick={() => state.count++}>增加数量</button>
          <button onClick={() => (state.price += 10)}>涨价</button>
        </div>
      </div>
    </div>
  );
};
