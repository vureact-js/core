import { ParseResult } from '@babel/parser';
import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { logger } from '@shared/logger';
import { capitalize } from '@utils/capitalize';
import { getVariableDeclaratorPath, isCalleeNamed, replaceNode } from '../../shared/babel-utils';

/**
 * withDefaults 占位标记注释，postprocess 阶段通过此注释定位替换位置。
 */
export const WITH_DEFAULTS_PLACEHOLDER = ' from withDefaults ';

/**
 * 解析 withDefaults 选项。
 *
 * 预处理阶段将 withDefaults(...) 调用替换为一个带 `/* from withDefaults *​/` 注释的
 * 空语句占位符，postprocess 阶段再替换为完整的 `const props = useMemo(...)`。
 *
 * 之所以不直接在此阶段生成 useMemo，是因为后续 resolve-props-interface 等处理
 * 会删除 defineProps 相关的变量声明节点，只有 postprocess 阶段才能确定最终形态。
 */
export function resolveWithDefaultsOptions(
  ctx: ICompilationContext,
  ast: ParseResult,
): TraverseOptions {
  if (ctx.inputType !== 'sfc') return {};

  return {
    CallExpression(path) {
      const { node } = path;
      const { filename, scriptData } = ctx;

      // 1. 校验：是否是 withDefaults 调用
      if (!isCalleeNamed(node, MACRO_API_NAMES.defaults)) {
        return;
      }

      const declaratorPath = getVariableDeclaratorPath(path)!;

      // 2. 校验：必须赋值给变量
      if (!declaratorPath) {
        logger.error(
          `withDefaults() must be assigned to a variable (e.g., const props = withDefaults(...)).`,
          { file: filename, source: scriptData.source, loc: node.loc },
        );
        return;
      }

      // 3. 获取变量声明名
      const varName = t.isIdentifier(declaratorPath.node.id)
        ? declaratorPath.node.id.name
        : undefined;

      if (!varName) {
        logger.error('withDefaults() could not determine the variable name from the declaration.', {
          file: filename,
          source: scriptData.source,
          loc: node.loc,
        });
        return;
      }

      // 4. 避免组件 props 参数名与当前变量名冲突
      ctx.propField = `vr${capitalize(ctx.propField)}`;

      // 5. 校验参数
      const [defineProps, defaults] = node.arguments;

      if (!node.arguments.length) {
        logger.error('withDefaults() requires at least one argument (defineProps call).', {
          file: filename,
          source: scriptData.source,
          loc: node.loc,
        });
        return;
      }

      if (!t.isCallExpression(defineProps)) {
        logger.error(
          'withDefaults() first argument must be a call to defineProps (e.g., defineProps({...})).',
          { file: filename, source: scriptData.source, loc: defineProps?.loc },
        );
        return;
      }

      if (defaults && !t.isObjectExpression(defaults)) {
        logger.error(
          'withDefaults() second argument must be an object literal (e.g., { msg: "hello" }).',
          { file: filename, source: scriptData.source, loc: defaults?.loc },
        );
        return;
      }

      // 6. 记录转换所需信息到上下文中
      recordPropsWithDefaults(ctx, varName, defineProps as t.CallExpression, defaults, node);

      // 7. 在当前声明位置之后插入占位空语句（带特殊注释标记）
      declaratorPath.parentPath.insertAfter(createPlaceholder(node));

      // 8. 保留 defineProps，移除 withDefaults 包装
      replaceNode(path, defineProps as t.CallExpression, node);
    },
  };
}

function recordPropsWithDefaults(
  ctx: ICompilationContext,
  varName: string,
  defineProps: t.CallExpression,
  defaults: t.ObjectExpression | undefined,
  withDefaults: t.CallExpression,
) {
  const { scriptData } = ctx;
  const { start, end, loc, leadingComments, innerComments, trailingComments } = withDefaults;

  const values = flattenDefaultValues(defaults);

  const getTypeParameters = (): t.TSTypeParameterInstantiation | undefined => {
    if (!scriptData.lang.startsWith('ts')) {
      return;
    }

    const { propsTypes } = scriptData.propsTSIface;

    const typeParameters =
      defineProps.typeParameters ||
      (propsTypes.length ? t.tSTypeParameterInstantiation(propsTypes) : undefined);

    if (typeParameters) {
      return t.tsTypeParameterInstantiation([
        t.tsTypeReference(t.identifier('Readonly'), typeParameters),
      ]);
    }
  };

  scriptData.propsWithDefaults = {
    varName,
    values,
    start,
    end,
    loc,
    leadingComments,
    innerComments,
    trailingComments,
    typeParameters: getTypeParameters(),
  };
}

/**
 * 展平 withDefaults 第二个参数对象中的函数包装值。
 *
 * Vue 中可变类型（数组/对象）的默认值需要用函数包装，如：
 *   labels: () => ['one', 'two']
 *
 * 转换为 React 时需要提取函数返回值，以便后续生成：
 *   labels: props.labels ?? ['one', 'two']
 *
 * 而不可变类型（字符串/数字/布尔）则无需包装，保持不变：
 *   msg: 'hello'             →  msg: props.msg ?? 'hello'
 */
function flattenDefaultValues(expr?: t.ObjectExpression): t.ObjectExpression | undefined {
  if (!expr) return;

  if (!t.isObjectExpression(expr)) {
    return expr;
  }

  const properties = expr.properties.map((prop) => {
    if (!t.isObjectProperty(prop)) {
      return prop;
    }

    const value = prop.value;

    // 如果值是箭头函数或函数表达式，提取其返回值
    if (t.isArrowFunctionExpression(value) && t.isBlockStatement(value.body)) {
      const returnStmt = value.body.body.find((stmt): stmt is t.ReturnStatement =>
        t.isReturnStatement(stmt),
      );
      if (returnStmt?.argument) {
        return t.objectProperty(prop.key, returnStmt.argument, prop.computed);
      }
    }

    // 如果值是箭头函数的简写体（无花括号），直接取其表达式
    if (t.isArrowFunctionExpression(value) && !t.isBlockStatement(value.body)) {
      return t.objectProperty(prop.key, value.body as t.Expression, prop.computed);
    }

    return prop;
  });

  return t.objectExpression(properties);
}

function createPlaceholder(node: t.CallExpression): t.EmptyStatement {
  const placeholder = t.emptyStatement();

  const leadingComments: t.Comment[] = [
    {
      type: 'CommentBlock',
      value: WITH_DEFAULTS_PLACEHOLDER,
      start: node.start!,
      end: node.end!,
    },
  ];

  placeholder.leadingComments = leadingComments;

  return placeholder;
}
