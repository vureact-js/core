import { PKG_NAME } from '@constants/other';
import { red, white, yellow } from 'colorette';

export function warn(
  message?: string,
  source: string = '',
  level: 'warn' | 'error' = 'warn'
) {
  const color = level === 'warn' ? yellow : red;
  const title = `⚠️  [${PKG_NAME} ${level}]`;
  const sourceMsg = `${source ? `\n      -> ${source}` : ''}`;
  console.log(color(`${title}: ${message} ${white(sourceMsg)}`));
}
