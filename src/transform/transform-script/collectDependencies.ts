import type { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import type { ScriptTransformContext } from './types';

export function collectDependencies(
  path: NodePath<t.Expression | t.Statement>,
  ctx: ScriptTransformContext
): string[] {
  if (!path || !path.node) return [];

  const deps = new Set<string>();
  const visited = new WeakSet<object>();

  const tryAddDep = (name: string) => {
    if (
      ctx.reactiveBindings.some(b => b.name === name) ||
      ctx.callbackDeps?.has(name)
    ) {
      deps.add(name);
    }
  };

  const visitor: Visitor = {
    Identifier(idPath: NodePath<t.Identifier>) {
      const node = idPath.node;
      if (!node || visited.has(node)) return;
      visited.add(node);

      // 跳过以下情况：
      // 1. 函数声明的名称
      // 2. 变量声明的左侧
      // 3. 函数参数名
      // 4. 对象属性名（非计算属性）
      if (
        idPath.parentPath?.isFunctionDeclaration({ id: node }) ||
        (idPath.parentPath?.isVariableDeclarator() &&
          idPath.parentKey === 'id') ||
        idPath.parentPath?.isFunction({ params: [node] }) ||
        (idPath.parentPath?.isMemberExpression() &&
          idPath.parentPath.node.property === node &&
          !idPath.parentPath.node.computed)
      ) {
        return;
      }

      tryAddDep(node.name);
    },

    MemberExpression(mePath: NodePath<t.MemberExpression>) {
      const node = mePath.node;
      if (!node || visited.has(node)) return;
      visited.add(node);

      // 检查是否是 .value 访问
      const isValueAccess =
        (t.isIdentifier(node.property) && node.property.name === 'value') ||
        (node.computed &&
          t.isStringLiteral(node.property) &&
          node.property.value === 'value');

      if (isValueAccess && t.isIdentifier(node.object)) {
        // 对于 xxx.value，收集 xxx
        tryAddDep(node.object.name);
      } else {
        // 对于其他成员表达式，递归检查 object
        let current = node.object;
        while (t.isMemberExpression(current)) {
          if (t.isIdentifier(current.object)) {
            tryAddDep(current.object.name);
            break;
          }
          current = current.object;
        }
      }
    },

    Function: {
      enter(path: NodePath<t.Function>) {
        // 如果是被分析的目标函数本身，继续遍历
        if (path.node === path.node) return;

        // 获取函数体
        const body = path.node.body;

        if (t.isBlockStatement(body)) {
          // 对于代码块函数体，遍历每个语句
          body.body.forEach(statement => {
            const stmtPath = path
              .get('body')
              .get('body')
              .find(p => p.node === statement);
            if (stmtPath) {
              // @ts-ignore
              const stmtDeps = collectDependencies(stmtPath, ctx);
              stmtDeps.forEach(d => deps.add(d));
            }
          });
        } else if (t.isExpression(body)) {
          // 对于箭头函数的表达式体，直接收集
          const bodyPath = path.get('body') as NodePath<t.Expression>;
          const exprDeps = collectDependencies(bodyPath, ctx);
          exprDeps.forEach(d => deps.add(d));
        }
      },
      exit(path) {
        // 函数处理完后再 skip，避免遗漏内部依赖
        path.skip();
      },
    },

    CallExpression(path: NodePath<t.CallExpression>) {
      const node = path.node;
      if (!node || visited.has(node)) return;
      visited.add(node);

      // 处理调用者（例如方法调用）
      if (t.isMemberExpression(node.callee)) {
        const calleeDeps = collectDependencies(
          path.get('callee') as NodePath<t.Expression | t.Statement>,
          ctx
        );
        calleeDeps.forEach(d => deps.add(d));
      }

      // 处理参数
      path.get('arguments').forEach(argPath => {
        if (argPath.isExpression()) {
          const argDeps = collectDependencies(argPath, ctx);
          argDeps.forEach(d => deps.add(d));
        }
      });
    },
  };

  path.traverse(visitor);

  return Array.from(deps);
}
