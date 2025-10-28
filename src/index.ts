import parser from '@parse/index';
import transformer from '@transform/index';

export function compile(vueCode: string, options: any) {
  const parsed = parser(vueCode);
  const transformed = transformer(parsed);
}
