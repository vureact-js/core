import { useCallback } from 'react';
import { useReactive } from '../../../../../src';

export const ReactiveNested = () => {
  const state = useReactive({
    user: {
      profile: { age: 25 },
      tags: ['React', 'Vue'],
    },
  });

  const addTag = useCallback(() => {
    // 像原生 JS 一样 push，视图会自动更新
    state.user.tags.push(new Date().toLocaleTimeString());
  }, [state.user.tags]);

  return (
    <div className="h-example-container">
      <h3>2. 深层嵌套与数组</h3>
      <p>年龄: {state.user.profile.age}</p>
      <ul>
        {state.user.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      <button onClick={() => state.user.profile.age++}>增加年龄</button>
      <button onClick={addTag}>添加标签 (Push)</button>
    </div>
  );
};
