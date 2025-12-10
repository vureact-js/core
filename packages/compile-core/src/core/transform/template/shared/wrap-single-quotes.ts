import { strCodeTypes } from '@shared/string-code-types';

export function wrapSingleQuotes(content: string, condition?: boolean) {
  return condition || strCodeTypes.isStringLiteral(content) ? `'${content}'` : content;
}
