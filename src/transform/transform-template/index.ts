import * as t from '@babel/types';
import type { ParsedResult } from '@parse/types';
import { Fragment } from '@transform/constants';
import { logger } from '@transform/utils/logger';
import { isNull } from '@utils/types';
import { transformChildren } from './transformChildren';
import type { ExtendedNode } from './types';

// 转换 Vue 模板 AST 为 JSX AST / Transform Vue template AST to JSX AST
export function transformTemplate(ast: ParsedResult): t.JSXElement | null {
  const { template } = ast;
  if (isNull(template)) return template;

  logger.addContext(ast.filename, template.source);

  const rootChildren = transformChildren(template.children as ExtendedNode[]);

  return t.jsxElement(
    t.jsxOpeningElement(t.jsxIdentifier(Fragment), []),
    t.jsxClosingElement(t.jsxIdentifier(Fragment)),
    rootChildren,
    false,
  );
}
