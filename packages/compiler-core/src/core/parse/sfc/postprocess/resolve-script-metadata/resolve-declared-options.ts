import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { logger } from '@shared/logger';
import { isCalleeNamed } from '@transform/sfc/script/shared/babel-utils';

/**
 * 收集 defineOptions 中声明的选项
 */
export function resolveDeclaredOptions(path: NodePath<t.CallExpression>, ctx: ICompilationContext) {
  const { node } = path;
  const { filename, scriptData } = ctx;

  if (!isCalleeNamed(node, MACRO_API_NAMES.options)) {
    return;
  }

  const [options] = node.arguments;

  // 选项必须是 ObjectExpression 类型
  if (!options || !t.isObjectExpression(options)) {
    logger.warn(
      `Expected argument to be of a type ["ObjectExpression"] but instead got "${options?.type}".`,
      {
        file: filename,
        source: scriptData.source,
        loc: options?.loc || node.loc,
      },
    );

    return;
  }

  const { source, declaredOptions } = scriptData;

  // 遍历选项进行收集
  for (const property of options.properties) {
    if (!t.isObjectProperty(property) || !t.isIdentifier(property.key) || property.computed) {
      continue;
    }

    const propKey = property.key;
    const propValue = property.value;

    if (propKey.name === 'name') {
      // 只允许 name 值为字符串字面量类型，避免过度解析
      if (!t.isStringLiteral(propValue)) {
        logger.warn(
          `Expected property to be of a type ["StringLiteral"] but instead got "${propValue.type}".`,
          {
            source,
            file: filename,
            loc: propKey?.loc,
          },
        );

        continue;
      }

      // 会覆盖通过注释 @vr-name 指定的组件名
      if (propValue.value.trim()) {
        declaredOptions.name = propValue.value.trim();
      }

      continue;
    }

    if (propKey.name === 'inheritAttrs') {
      // 只允许 inheritAttrs 值为布尔字面量类型，避免过度解析
      if (!t.isBooleanLiteral(propValue)) {
        logger.warn(
          `Expected property to be of a type ["BooleanLiteral"] but instead got "${propValue.type}".`,
          {
            source,
            file: filename,
            loc: propKey?.loc,
          },
        );

        continue;
      }

      declaredOptions.inheritAttrs = propValue.value;
    }
  }
}
