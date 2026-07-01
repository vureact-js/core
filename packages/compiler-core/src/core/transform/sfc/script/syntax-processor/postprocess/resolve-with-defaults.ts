import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext, PropsWithDefaults } from '@compiler/context/types';
import { PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@transform/shared';
import { createUseMemo } from '../../shared/hook-creator';
import { WITH_DEFAULTS_PLACEHOLDER } from '../preprocess/resolve-with-defaults';

/**
 * 处理 withDefaults 宏，根据 preprocess 阶段留下的注释占位符，
 * 找到对应位置并替换为完整的 `const props = useMemo(...)` 声明。
 *
 * 转换结果类似如下：
 *
 * - Vue
 *
 * ```ts
 * const props = withDefaults(defineProps<Props>(), {
 *   msg: 'hello',
 *   labels: () => ['one', 'two'],
 * });
 *```
 * - → React
 *
 * ```tsx
 * const props = useMemo<Props>(
 *   () => ({
 *     msg: $props?.msg ?? 'hello',
 *     labels: $props?.labels ?? ['one', 'two'],
 *   }),
 *   [$props?.msg, $props?.labels],
 * );
 * ```
 */
export function resolveWithDefaults(ctx: ICompilationContext): TraverseOptions {
  const { inputType, scriptData } = ctx;
  const propsWithDefaults = scriptData.propsWithDefaults;

  if (inputType !== 'sfc' || !propsWithDefaults?.values) return {};

  return {
    Program: {
      exit(programPath) {
        const { body } = programPath.node;
        const placeholderIndex = findPlaceholderIndex(body);

        if (placeholderIndex === -1) return;

        const placeholder = body[placeholderIndex]!;
        const { varName, values, typeParameters } = propsWithDefaults;

        // 构造完整声明并替换占位符
        const varDeclaration = createVarDeclaration(
          varName,
          values as t.ObjectExpression,
          typeParameters,
          ctx.propField,
          propsWithDefaults,
        );

        varDeclaration.leadingComments = placeholder.leadingComments;

        body.splice(placeholderIndex, 0, varDeclaration);

        // 记录 useMemo 的导入
        recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.useMemo);
      },
    },
  };
}

/**
 * 在 Program.body 中找到 preprocess 阶段留下的占位空语句。
 */
function findPlaceholderIndex(body: t.Statement[]): number {
  return body.findIndex((stmt) => {
    if (!t.isEmptyStatement(stmt) || !stmt.leadingComments) {
      return false;
    }

    return stmt.leadingComments.some(
      (comment) => comment.type === 'CommentBlock' && comment.value === WITH_DEFAULTS_PLACEHOLDER,
    );
  });
}

/**
 * 构造完整的 `const <name> = useMemo<TypeParameters>(() => ({...}), [vrProps])` 声明。
 */
function createVarDeclaration(
  varName: string,
  values: t.ObjectExpression,
  typeParameters: t.TSTypeParameterInstantiation | null | undefined,
  propField: string,
  sourceInfo: PropsWithDefaults,
): t.VariableDeclaration {
  const { mergeMembers } = buildMergeLogic(values, propField);

  // 依赖整个组件 props 对象
  const deps = t.arrayExpression([t.identifier(propField)]);
  const useMemoCall = createUseMemo(t.objectExpression(mergeMembers), deps);

  // 只有 ts 环境下才可能会有值
  if (typeParameters) {
    useMemoCall.typeParameters = typeParameters;
  }

  // 继承原 withDefaults 调用的位置/注释信息
  useMemoCall.start = sourceInfo.start;
  useMemoCall.end = sourceInfo.end;
  useMemoCall.loc = sourceInfo.loc;
  useMemoCall.leadingComments = sourceInfo.leadingComments;
  useMemoCall.innerComments = sourceInfo.innerComments;
  useMemoCall.trailingComments = sourceInfo.trailingComments;

  const varDeclarator = t.variableDeclarator(t.identifier(varName), useMemoCall);
  return t.variableDeclaration('const', [varDeclarator]);
}

/**
 * 根据默认值对象，生成 useMemo 箭头函数体的成员。
 *
 * 输入：{ msg: 'hello', labels: ['one', 'two'] }
 * 输出：
 *   [SpreadElement(vrProps),
 *    ObjectProperty('msg', vrProps.msg ?? 'hello'),
 *    ObjectProperty('labels', vrProps.labels ?? ['one', 'two'])]
 */
function buildMergeLogic(
  values: t.ObjectExpression,
  propField: string,
): {
  mergeMembers: (t.SpreadElement | t.ObjectMember)[];
} {
  const mergeMembers: (t.ObjectMember | t.SpreadElement)[] = [];
  const propFieldIdent = t.identifier(propField);

  // 1. 展开原始 props：...vrProps
  mergeMembers.push(t.spreadElement(propFieldIdent));

  // 2. 对每个有默认值的字段生成 vrProps.xx ?? defaultValue
  for (const defaultProp of values.properties) {
    if (!t.isObjectProperty(defaultProp)) continue;

    const key = defaultProp.key;
    if (!t.isIdentifier(key) && !t.isStringLiteral(key)) continue;

    const keyName = t.isIdentifier(key) ? key.name : key.value;

    // vrProps.xx
    const propAccess = t.memberExpression(propFieldIdent, t.identifier(keyName), false);

    // vrProps.xx ?? defaultValue
    const logicalExpr = t.logicalExpression('??', propAccess, defaultProp.value as t.Expression);

    mergeMembers.push(
      t.objectProperty(
        t.isIdentifier(key) ? t.identifier(keyName) : t.stringLiteral(keyName),
        logicalExpr,
      ),
    );
  }

  return { mergeMembers };
}
