import { useComputed, useReactive } from '../../../../../src';

export const ComputedList = () => {
  const state = useReactive({
    searchQuery: '',
    items: ['Apple', 'Banana', 'Cherry', 'Date', 'Eggplant'],
  });

  // 只有 searchQuery 或 items 变化时才会重新过滤
  const filteredList = useComputed(() => {
    return state.items.filter((item) =>
      item.toLowerCase().includes(state.searchQuery.toLowerCase()),
    );
  });

  return (
    <div className="i-example-container">
      <h3>3. 列表过滤缓存</h3>
      <input
        type="text"
        placeholder="搜索水果..."
        value={state.searchQuery}
        onChange={(e) => (state.searchQuery = e.target.value)}
      />

      <ul className="list">
        {filteredList.value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {filteredList.value.length === 0 && <p className="hint">没找到结果</p>}
    </div>
  );
};
