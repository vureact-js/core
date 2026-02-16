/**
 * React adapter for Vue's nextTick.
 */
export function nextTick<T, R>(this: T, fn?: (this: T) => R | Promise<R>): Promise<R> {
  return new Promise((resolve) => {
    const execute = () => {
      const result = fn?.call(this);
      resolve(result as R);
    };

    if (typeof Promise !== 'undefined') {
      Promise.resolve().then(execute);
      return;
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(execute);
      return;
    }

    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        execute();
      });

      const textNode = document.createTextNode('');
      observer.observe(textNode, { characterData: true });
      textNode.data = '1';

      return;
    }

    setTimeout(execute, 0);
  });
}
