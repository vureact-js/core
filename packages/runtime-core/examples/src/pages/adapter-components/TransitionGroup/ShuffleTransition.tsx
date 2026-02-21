import { useState } from 'react';
import { TransitionGroup } from '../../../../../src';

const INITIAL_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const ShuffleTransition = () => {
  const [items, setItems] = useState<number[]>(INITIAL_ITEMS);
  const [nextNum, setNextNum] = useState(10);

  // 1. 洗牌：随机打乱顺序
  const shuffle = () => {
    setItems([...items].sort(() => Math.random() - 0.5));
  };

  // 2. 随机新增：在随机位置插入一个数字
  const add = () => {
    const randomIndex = Math.floor(Math.random() * items.length);
    const newItems = [...items];
    newItems.splice(randomIndex, 0, nextNum);
    setItems(newItems);
    setNextNum(nextNum + 1);
  };

  // 3. 随机删除：移除一个随机位置的数字
  const remove = () => {
    if (items.length === 0) return;
    const randomIndex = Math.floor(Math.random() * items.length);
    const newItems = [...items];
    newItems.splice(randomIndex, 1);
    setItems(newItems);
  };

  // 4. 重置：恢复到初始状态
  const reset = () => {
    setItems(INITIAL_ITEMS);
    setNextNum(10);
  };

  return (
    <div className="f-example-container">
      <h3>高级列表过渡演示</h3>
      <p>包含洗牌、随机增删及重置功能：</p>

      <div className="button-group">
        <button onClick={shuffle} className="btn-primary">
          洗牌
        </button>
        <button onClick={add} className="btn-success">
          随机新增
        </button>
        <button onClick={remove} className="btn-danger">
          随机删除
        </button>
        <button onClick={reset} className="btn-secondary">
          重置
        </button>
      </div>

      <div className="shuffle-wrapper">
        <TransitionGroup
          tag="ul"
          name="list"
          moveClass="list-move"
          htmlProps={{ className: 'shuffle-container' }}
        >
          {items.map((item) => (
            <li key={item} className="shuffle-item">
              {item}
            </li>
          ))}
        </TransitionGroup>
      </div>
    </div>
  );
};
