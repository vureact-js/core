interface Spinner {
  start(text?: string): Spinner;
  stop(): Spinner;
  succeed(text?: string): Spinner;
  fail(text?: string): Spinner;
}

// 模拟的 ora。真实的 ora 在 jest 测试中无法运行
export default function ora(): Spinner {
  const spinner: Spinner = {
    start: () => spinner,
    stop: () => spinner,
    succeed: () => spinner,
    fail: () => spinner,
  };

  return spinner;
}
