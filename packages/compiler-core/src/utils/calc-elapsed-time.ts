/**
 * Calculate the operation elapsed time.
 * @param start The start time obtained by calling `performance.now()`
 * @returns Returns a string with a time unit
 */
export function calcElapsedTime(start: number): string {
  const end = performance.now();
  return formattDuration(end - start);
}

/**
 * 1200 => '1.2s'
 *
 * 120 => '120ms'
 */
export function formattDuration(n: number): string {
  const num = n < 1000 ? Math.floor(n) : n.toFixed(1);

  let duration = `${num} ms`;
  if (n >= 1000) {
    duration = `${(n / 1000).toFixed(1)}s`;
  }

  return duration;
}
