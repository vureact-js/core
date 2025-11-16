import type { RouteLocation } from '../hooks/useRoute';

export interface GuardManager {
  beforeEach(guard: BeforeEachGuard): () => void;
  afterEach(guard: AfterEachGuard): () => void;
}

export type BeforeEachGuard = (
  to: GuardRouteLocation,
  from: GuardRouteLocation,
  next: (result?: Result) => void,
) => any | Promise<any>;

export type AfterEachGuard = (
  to: GuardRouteLocation,
  from: GuardRouteLocation,
) => void | Promise<void>;

export type GuardRouteLocation = Partial<RouteLocation & { meta: Record<string, any> }>;

type Result = boolean | string | GuardRouteLocation | Error;

export class GuardManagerImpl implements GuardManager {
  private beforeEachGuards: BeforeEachGuard[] = [];
  private afterEachGuards: AfterEachGuard[] = [];

  private isExecuting = false;

  beforeEach(guard: BeforeEachGuard): () => void {
    this.beforeEachGuards.push(guard);
    return () => {
      const index = this.beforeEachGuards.indexOf(guard);
      if (index > -1) {
        this.beforeEachGuards.splice(index, 1);
      }
    };
  }

  afterEach(guard: AfterEachGuard): () => void {
    this.afterEachGuards.push(guard);
    return () => {
      const index = this.afterEachGuards.indexOf(guard);
      if (index > -1) {
        this.afterEachGuards.splice(index, 1);
      }
    };
  }

  /**
   * 顺序执行 beforeEach guards。
   * 支持以下几种写法：
   *  - 同步调用 next(value)
   *  - 同步 return value
   *  - 异步返回 Promise 并在内部 resolve/next
   *
   * 返回值：
   *  - true 表示通过
   *  - false 表示阻止导航
   *  - string / route-like 表示重定向
   */
  async runBeforeEach(to: GuardRouteLocation, from: GuardRouteLocation): Promise<Result> {
    if (this.isExecuting) {
      console.warn('[Router] Navigation guard is already executing');
      return true;
    }

    this.isExecuting = true;

    try {
      for (const guard of this.beforeEachGuards) {
        const guardResult: Result = await new Promise<Result>((resolve) => {
          let nextCalled = false;

          const next = (value?: Result) => {
            if (nextCalled) {
              console.warn('[Router] next() called multiple times in navigation guard');
              return;
            }
            nextCalled = true;

            if (value instanceof Error) {
              console.error('[Router] Error passed to next():', value);
              resolve(false);
            } else if (value === undefined) {
              resolve(true);
            } else {
              resolve(value);
            }
          };

          try {
            const ret = guard(to, from, next);

            // guard 返回 Promise（异步守卫）
            if (ret instanceof Promise) {
              ret
                .then((v) => {
                  if (!nextCalled) {
                    // 优先采用 Promise resolve 的值（若为 undefined 则继续）
                    resolve(v !== undefined ? (v as Result) : true);
                  }
                })
                .catch((err) => {
                  if (!nextCalled) {
                    console.error('[Router] Error in async guard:', err);
                    resolve(false);
                  }
                });
            } else {
              // guard 同步返回值
              if (ret !== undefined) {
                resolve(ret as Result);
              } else {
                // 没有返回也没调用 next：等待微任务，让同步 guard 有机会调用 next
                Promise.resolve().then(() => {
                  if (!nextCalled) {
                    // 如果仍未调用 next，则默认继续
                    resolve(true);
                  }
                });
              }
            }
          } catch (err) {
            if (!nextCalled) {
              console.error('[Router] Error when executing guard:', err);
              resolve(false);
            }
          }
        });

        // 如果某个守卫返回非 true，则中断并返回该结果（用于重定向或阻塞）
        if (guardResult !== undefined && guardResult !== true) {
          return guardResult;
        }
      }

      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  // 同步执行 afterEach（不影响导航流）
  runAfterEach(to: GuardRouteLocation, from: GuardRouteLocation): void {
    try {
      this.afterEachGuards.forEach((guard) => {
        try {
          guard(to, from);
        } catch (err) {
          console.error('[Router] Error in afterEach guard:', err);
        }
      });
    } catch (err) {
      console.error('[Router] Error executing afterEach guards:', err);
    }
  }

  clear() {
    this.isExecuting = false;
    this.beforeEachGuards.length = 0;
    this.afterEachGuards.length = 0;
  }
}
