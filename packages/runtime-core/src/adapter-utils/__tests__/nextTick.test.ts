import { nextTick } from '../nextTick';

describe('nextTick test suites', () => {
  let mockFn: jest.Mock;

  beforeEach(() => {
    mockFn = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute the callback asynchronously, deferred to the microtask queue.', async () => {
    let syncFlag = false;

    nextTick(() => {
      mockFn();
      // 在 nextTick 回调中，同步代码应该已经执行完毕
      expect(syncFlag).toBe(true);
    });

    // 在 nextTick 调度后立即设置同步 Flag
    syncFlag = true;

    // mockFn 不应该被调用，因为它被推入了微任务队列
    expect(mockFn).not.toHaveBeenCalled();

    // 等待微任务队列清空
    // await Promise.resolve();
    await nextTick();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('hould return a Promise that resolves with the return value of the callback.', async () => {
    const RETURN_VALUE = 42;

    const promise = nextTick(() => {
      mockFn();
      return RETURN_VALUE;
    });

    expect(promise).toBeInstanceOf(Promise);

    const result = await promise;

    expect(result).toBe(RETURN_VALUE);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
