/**
 * 格式化当前时间为 HH:MM:SS
 */
export function formatHHMMSS(): string {
  const date = new Date();
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
