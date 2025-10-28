import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { ScriptTransformContext } from './types';
import { stripValueSuffix } from './utils';

export function stripAllValues(ast: t.File, ctx: ScriptTransformContext) {
  const visited = new WeakSet<object>();
  const toStrip: Array<{
    path: NodePath<t.MemberExpression>;
    replacement: t.Expression;
  }> = [];

  // First pass: collect replace candidates using stripValueSuffix (no AST mutation)
  traverse(ast, {
    MemberExpression: {
      enter(path) {
        if (!path.node || visited.has(path.node)) return;
        visited.add(path.node);

        const node = path.node;
        // only consider .value accesses where property is 'value' (identifier or literal)
        const isValueProp =
          (t.isIdentifier(node.property) && node.property.name === 'value') ||
          (node.computed &&
            t.isStringLiteral(node.property) &&
            node.property.value === 'value');

        if (!isValueProp) return;

        // compute replacement expression using centralized logic
        const replacement = stripValueSuffix(node, ctx, 50);
        // if stripValueSuffix returned something different, schedule replacement
        if (replacement && !t.isNodesEquivalent(replacement, node)) {
          toStrip.push({
            path: path as NodePath<t.MemberExpression>,
            replacement,
          });
          path.skip();
        }
      },
    },
  });

  // Second pass: perform replacements (batch), avoiding mutations during traversal
  for (const { path, replacement } of toStrip) {
    if (!path.node) continue;
    const parentPath = path.parentPath;

    // If the MemberExpression is used as a callee: replace entire CallExpression with new callee + same args
    if (
      parentPath &&
      parentPath.isCallExpression() &&
      parentPath.node.callee === path.node
    ) {
      const args = parentPath.node.arguments || [];
      const newCall = t.callExpression(
        replacement as t.Expression,
        args as t.Expression[]
      );
      // safety: do not replace with identical node
      if (!t.isNodesEquivalent(newCall, parentPath.node)) {
        parentPath.replaceWith(newCall);
      }
      continue;
    }

    // Otherwise replace the MemberExpression itself
    if (!t.isNodesEquivalent(replacement, path.node)) {
      path.replaceWith(replacement);
    }
  }
}
