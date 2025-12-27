import { TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { compileContext, DefinePropExp } from '@src/shared/compile-context';
import { createPropsProcessor, PropDescribe } from './processor-factory';

/*
 * 示例代码：
 *
 * const props1 = defineProps(['foo', 'bar']);
 * const props2 = defineProps<{
 *   foo?: string;
 *   bar: number;
 * }>();
 * const props3 = defineProps({
 *   foo: String,
 *   bar: {
 *     type: Number,
 *     required: true,
 *   },
 * });
 * const props4 = defineProps<Props>();
 *
 * 无名 props：
 * defineProps(['foo', 'bar']);
 *
 * 生成阶段期望的 props 代码：
 *
 * function Aa(props1) {}
 * function Aa(props2: {foo?: string; bar: number;}) {}
 * function Aa(props3) {}
 * function Aa(props4: Props) {}
 * function Aa({foo, bar}) {}
 */

export function processDefinePropsEmitsApi(): TraverseOptions {
  const { defineProps, lang } = compileContext.context;

  return {
    CallExpression(path) {
      createPropsProcessor(path, {
        onProcessed(type, describe) {
          const isTS = lang.script.startsWith('ts');
          const props = normalizeProps(describe, isTS);

          defineProps.exp.push(props);

          if (!defineProps.multiple && defineProps.exp.length > 1) {
            defineProps.multiple = true;
          }
        },
      });
    },
  };
}

function normalizeProps(describe: PropDescribe, isTS: boolean): DefinePropExp {
  const { id, arg, tsType } = describe;

  // 处理 TypeScript 泛型形式
  if (tsType && isTS) {
    return {
      id,
      exp: createEmptyObjectExpression(), // 泛型形式运行时为空对象
      tsType, // 直接存储类型参数，不转换
    };
  }

  // 处理运行时参数
  let exp: t.ObjectExpression | t.SpreadElement | t.ObjectPattern;

  if (!arg.length) {
    // 无参数，创建空对象
    exp = createEmptyObjectExpression();
  } else if (t.isArrayExpression(arg[0])) {
    // 数组形式：['foo', 'bar'] -> { foo, bar }
    exp = arrayToObjectPattern(arg[0]);
  } else if (t.isObjectExpression(arg[0])) {
    // 对象形式，只提取键名：{ foo: String, bar: { type: Number } } -> { foo, bar }
    exp = objectExpressionToObjectPattern(arg[0]);
  } else if (t.isSpreadElement(arg[0])) {
    // 展开元素
    exp = arg[0];
  } else {
    // 其他情况（如引用变量），创建包含剩余元素的对象模式
    exp = t.objectPattern([t.restElement(t.identifier('restProps'))]);
  }

  return {
    id,
    exp,
    tsType, // 只保存用户提供的类型
  };
}

function createEmptyObjectExpression(): t.ObjectExpression {
  return t.objectExpression([]);
}

function arrayToObjectPattern(array: t.ArrayExpression): t.ObjectPattern {
  const properties: t.ObjectProperty[] = [];

  for (const element of array.elements) {
    if (element && !t.isSpreadElement(element)) {
      if (t.isStringLiteral(element)) {
        // 字符串字面量：'foo' -> foo
        properties.push(
          t.objectProperty(
            t.identifier(element.value),
            t.identifier(element.value),
            false,
            true, // 简写形式
          ),
        );
      } else if (t.isIdentifier(element)) {
        // 标识符：foo -> foo
        properties.push(t.objectProperty(element, element, false, true));
      }
    }
  }

  return t.objectPattern(properties);
}

function objectExpressionToObjectPattern(obj: t.ObjectExpression): t.ObjectPattern {
  const properties: t.ObjectProperty[] = [];

  for (const prop of obj.properties) {
    if (t.isObjectProperty(prop) && !prop.computed) {
      let keyName: string;

      if (t.isIdentifier(prop.key)) {
        keyName = prop.key.name;
      } else if (t.isStringLiteral(prop.key)) {
        keyName = prop.key.value;
      } else {
        continue; // 跳过计算属性
      }

      // 创建简写形式的对象属性：foo: String -> foo
      properties.push(
        t.objectProperty(
          t.identifier(keyName),
          t.identifier(keyName),
          false,
          true, // 简写形式
        ),
      );
    } else if (t.isSpreadElement(prop)) {
      // 保留展开运算符
      properties.push(prop as unknown as t.ObjectProperty);
    }
  }

  return t.objectPattern(properties);
}
