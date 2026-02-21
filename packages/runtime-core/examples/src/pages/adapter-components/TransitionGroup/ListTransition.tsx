import { useState } from 'react';
import { TransitionGroup } from '../../../../../src';

export const ListTransition = () => {
  const [items, setItems] = useState([1, 2, 3, 4, 5]);
  const [nextNum, setNextNum] = useState(6);

  const add = () => {
    const index = Math.floor(Math.random() * items.length);
    const newItems = [...items];
    newItems.splice(index, 0, nextNum);
    setItems(newItems);
    setNextNum(nextNum + 1);
  };

  const remove = () => {
    const index = Math.floor(Math.random() * items.length);
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  return (
    <div className="f-example-container">
      <h3>1. 基础列表过渡</h3>
      <div className="button-group">
        <button onClick={add}>随机插入</button>
        <button onClick={remove}>随机删除</button>
      </div>

      {/* tag="div" 指定外层容器，htmlProps 传递原生属性 */}
      <TransitionGroup name="list" tag="div" htmlProps={{ className: 'list-container"' }}>
        {items.map((item) => (
          <div key={item} className="list-item">
            项目 {item}
          </div>
        ))}
      </TransitionGroup>
    </div>
  );
};
