import * as t from '@babel/types';
import { REACT_HOOKS } from '@constants/react';
import { VUE_DIR, VUE_EV_MODIF, VUE_KEY_MODIF, VUE_TO_REACT_PROP_MAP } from '@constants/vue';
import { VUE_TO_REACT_EVENTS } from '@transform/constants';
import { capitalize, createSetterName } from '@transform/utils';
import { logger } from '@transform/utils/logger';
import { isString, isUndefined } from '@utils/types';
import type { AttributeNode, SimpleExpressionNode } from '@vue/compiler-core';
import { ElementTypes, NodeTypes } from '@vue/compiler-core';
import { RequiresBabelExp } from './constants';
import { transformChildren } from './transformChildren';
import type {
  ExtendedDirectiveNode,
  ExtendedElementNode,
  ExtendedNode,
  ExtendJSXProps,
} from './types';
import { extractParamFromSlot } from './utils';

export function transformDirective(
  directive: ExtendedDirectiveNode,
  elementNode?: ExtendedElementNode,
): ExtendJSXProps {
  // Only check babelExp for directives that require it
  if (RequiresBabelExp.includes(directive.name) && isUndefined(directive.babelExp)) {
    logger.error(directive, 'Invalid directive expression');
    return null;
  }

  switch (directive.name) {
    // Structural directives handled in transformElement
    case VUE_DIR.is:
    case VUE_DIR.if:
    case VUE_DIR.elseIf:
    case VUE_DIR.else:
    case VUE_DIR.for:
    case VUE_DIR.once:
    case VUE_DIR.memo:
    case VUE_DIR.text: {
      return null;
    }
    case VUE_DIR.bind: {
      if (directive.arg?.type !== NodeTypes.SIMPLE_EXPRESSION) {
        logger.error(directive, 'v-bind requires valid variable name');
        return null;
      }
      const attrName = directive.arg.content;
      if (directive.arg.isStatic) {
        const jsxAttrName = VUE_TO_REACT_PROP_MAP[attrName] || attrName;
        return t.jsxAttribute(
          t.jsxIdentifier(jsxAttrName),
          directive.babelExp ? t.jsxExpressionContainer(directive.babelExp) : null,
        );
      } else {
        if (isUndefined(directive.babelArgExp)) {
          logger.error(directive, 'The argument expression for dynamic binding is invalid.');
          return null;
        }
        return t.jsxSpreadAttribute(
          t.objectExpression([
            t.objectProperty(
              directive.babelArgExp as t.Expression,
              (directive.babelExp as t.Expression) || t.booleanLiteral(true),
              true,
            ),
          ]),
        );
      }
    }
    case VUE_DIR.on: {
      if (directive.arg?.type !== NodeTypes.SIMPLE_EXPRESSION) {
        logger.error(directive, 'v-on requires valid event name');
        return null;
      }
      const eventName = directive.arg.content;
      const reactEvent = VUE_TO_REACT_EVENTS[eventName] || `on${capitalize(eventName)}`;
      const modifiers: string[] = directive.modifiers.map((d) => d.content) || [];

      // Return directly if no modifiers
      if (!modifiers.length) {
        return t.jsxAttribute(
          t.jsxIdentifier(reactEvent),
          directive.babelExp ? t.jsxExpressionContainer(directive.babelExp) : null,
        );
      }

      // 包装事件处理函数，注入修饰符逻辑 / Wrap event handler with modifier logic
      const handler = directive.babelExp || t.identifier('undefined');
      const params: t.Identifier[] = [t.identifier('e')];
      let body: t.Statement[] = [];

      // Stop event propagation
      if (modifiers.includes(VUE_EV_MODIF.stop)) {
        body.push(
          t.expressionStatement(
            t.callExpression(t.memberExpression(params[0]!, t.identifier('stopPropagation')), []),
          ),
        );
      }

      // Prevent default behavior
      if (modifiers.includes(VUE_EV_MODIF.prevent)) {
        body.push(
          t.expressionStatement(
            t.callExpression(t.memberExpression(params[0]!, t.identifier('preventDefault')), []),
          ),
        );
      }

      // Only trigger if target is self
      if (modifiers.includes(VUE_EV_MODIF.self)) {
        body.push(
          t.ifStatement(
            t.binaryExpression(
              '!==',
              t.memberExpression(params[0]!, t.identifier('target')),
              t.memberExpression(params[0]!, t.identifier('currentTarget')),
            ),
            t.returnStatement(),
          ),
        );
      }

      // 处理 .left, .middle, .right / Restrict mouse buttons
      const mouseButtons: Record<string, number> = {
        left: 0,
        middle: 1,
        right: 2,
      };
      const mouseModifier = modifiers.find((m) =>
        [VUE_EV_MODIF.left, VUE_EV_MODIF.middle, VUE_EV_MODIF.right].includes(m),
      );

      if (!isUndefined(mouseModifier)) {
        body.push(
          t.ifStatement(
            t.binaryExpression(
              '!==',
              t.memberExpression(params[0]!, t.identifier('button')),
              t.numericLiteral(mouseButtons[mouseModifier]!),
            ),
            t.returnStatement(),
          ),
        );
      }

      // 处理 .{keyAlias} / Handle key aliases (e.g., .enter, .esc)
      const keyModifier = modifiers.find((m) => m in VUE_KEY_MODIF);
      if (keyModifier) {
        body.push(
          t.ifStatement(
            t.binaryExpression(
              '!==',
              t.memberExpression(params[0]!, t.identifier('key')),
              t.stringLiteral(VUE_KEY_MODIF[keyModifier]!),
            ),
            t.returnStatement(),
          ),
        );
      }

      // 调用原始处理函数 / Call original handler
      body.push(t.expressionStatement(t.callExpression(handler, params)));

      // Handle once modifier with useCallback
      const eventHandler = t.arrowFunctionExpression(params, t.blockStatement(body));
      const finalHandler = modifiers.includes(VUE_EV_MODIF.once)
        ? t.callExpression(t.identifier(REACT_HOOKS.useCallback), [
            eventHandler,
            t.arrayExpression([]),
          ])
        : eventHandler;

      // Handle capture and passive options
      const eventOptions: Record<string, t.Expression> = {};
      if (modifiers.includes(VUE_EV_MODIF.capture)) eventOptions.capture = t.booleanLiteral(true);
      if (modifiers.includes(VUE_EV_MODIF.passive)) eventOptions.passive = t.booleanLiteral(true);

      return t.jsxAttribute(
        t.jsxIdentifier(reactEvent),
        t.jsxExpressionContainer(
          Object.keys(eventOptions).length
            ? t.objectExpression([
                t.objectProperty(t.identifier('handler'), finalHandler),
                ...Object.entries(eventOptions).map(([key, value]) =>
                  t.objectProperty(t.identifier(key), value),
                ),
              ])
            : finalHandler,
        ),
      );
    }
    case VUE_DIR.model: {
      if (isUndefined(directive.babelExp) || isUndefined(elementNode)) {
        logger.error(directive, 'Invalid expression or element for v-model');
        return null;
      }

      const typeAttr = elementNode.props.find(
        (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'type',
      ) as AttributeNode;

      const multipleAttr = elementNode.props.some(
        (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'multiple',
      );

      const modifiers = directive.modifiers.map((m) => m.content);
      const isDynamic = !!directive.arg && !(directive.arg as SimpleExpressionNode).isStatic; // v-model:[dynamicAttr]
      const propName = isDynamic
        ? directive.babelArgExp
        : (directive.arg as SimpleExpressionNode)?.content || 'modelValue';

      const type = typeAttr?.value?.content ?? '';
      const tag = elementNode.tag.toLocaleLowerCase();

      const getValuePropName = () => {
        if (isDynamic || tag === 'select' || tag === 'textarea') return propName; // Dynamic or component/select/textarea
        if (tag === 'input' && (type === 'checkbox' || type === 'radio')) return 'checked';
        return 'value';
      };

      const getEventName = () => {
        if (isDynamic)
          // 使用 templateLiteral 生成动态事件名（如 onUpdate_${dynamicAttr}）
          // Use templateLiteral to generate dynamic event names (such as onUpdate_${dynamicAttr})
          return t.templateLiteral(
            [t.templateElement({ raw: 'onUpdate_' }), t.templateElement({ raw: '' })],
            [propName as t.Expression],
          );
        if (tag === 'select' || tag === 'textarea' || isDynamic || propName !== 'modelValue')
          return createSetterName(propName as string, 'onUpdate_');
        return modifiers.includes('lazy') ? 'onChange' : 'onInput';
      };

      // 封装更新表达式，支持修饰符 .number/.trim / Encapsulate update expr, support .number/.trim
      const getUpdateExpr = (rawExpr: t.Expression): t.Expression => {
        let expr = rawExpr;
        if (modifiers.includes('number')) {
          expr = t.callExpression(
            t.memberExpression(t.identifier('Number'), t.identifier('parseFloat')),
            [expr],
          );
        }
        if (modifiers.includes('trim')) {
          expr = t.callExpression(t.memberExpression(expr, t.identifier('trim')), []);
        }
        return expr;
      };

      // 封装 setter 调用，适应 React useState / Encapsulate setter call for React useState
      const getSetterCall = (babelExp: t.Expression, update: t.Expression): t.Expression => {
        if (t.isIdentifier(babelExp)) {
          // setValue(update)
          return t.callExpression(t.identifier(createSetterName(babelExp.name)), [update]);
        } else if (
          t.isMemberExpression(babelExp) &&
          t.isIdentifier(babelExp.object) &&
          t.isIdentifier(babelExp.property)
        ) {
          // setObj({ ...obj, prop: update })
          return t.callExpression(t.identifier(createSetterName(babelExp.object.name)), [
            t.arrowFunctionExpression([t.identifier(babelExp.object.name)], update),
          ]);
        } else {
          // 复杂表达式: 回退到直接赋值 / Fallback to direct assignment for complex expr
          logger.warn(directive, 'Complex v-model expression may need manual setter in React');
          return t.assignmentExpression('=', babelExp as t.LVal, update);
        }
      };

      const valuePropName = getValuePropName();
      const isComponent = elementNode.tagType === ElementTypes.COMPONENT;
      const eventName = getEventName();

      let rawUpdateExpr: t.Expression;
      if (isComponent) {
        // 自定义组件: update = e
        rawUpdateExpr = t.identifier('e');
      } else if (tag === 'input') {
        switch (type) {
          case 'checkbox': {
            rawUpdateExpr = t.memberExpression(t.identifier('e'), t.identifier('target.checked'));
            break;
          }
          case 'radio': {
            const valueAttr = elementNode.props.find(
              (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'value',
            ) as AttributeNode | undefined;
            if (isUndefined(valueAttr)) {
              logger.warn(elementNode, 'Radio input requires value attribute for v-model');
              return null;
            }
            rawUpdateExpr = t.conditionalExpression(
              t.memberExpression(t.identifier('e'), t.identifier('target.checked')),
              t.stringLiteral(valueAttr.value?.content ?? ''),
              directive.babelExp,
            );
            break;
          }
          case 'file': {
            rawUpdateExpr = t.memberExpression(t.identifier('e'), t.identifier('target.files'));
            break;
          }
          default: {
            rawUpdateExpr = t.memberExpression(t.identifier('e'), t.identifier('target.value'));
            break;
          }
        }
      } else if (tag === 'select') {
        if (multipleAttr) {
          rawUpdateExpr = t.callExpression(
            t.memberExpression(t.identifier('Array'), t.identifier('from')),
            [
              t.memberExpression(t.identifier('e'), t.identifier('target.selectedOptions')),
              t.arrowFunctionExpression(
                [t.identifier('o')],
                t.memberExpression(t.identifier('o'), t.identifier('value')),
              ),
            ],
          );
        } else {
          rawUpdateExpr = t.memberExpression(t.identifier('e'), t.identifier('target.value'));
        }
      } else if (tag === 'textarea') {
        rawUpdateExpr = t.memberExpression(t.identifier('e'), t.identifier('target.value'));
      } else {
        logger.warn(elementNode, 'Unsupported tag for v-model');
        return null;
      }

      const updateExpr = getUpdateExpr(rawUpdateExpr);
      const setterExpr = getSetterCall(directive.babelExp, updateExpr);

      const valueProp = isDynamic
        ? t.objectProperty(propName as t.Expression, directive.babelExp, true)
        : t.objectProperty(t.identifier(valuePropName as string), directive.babelExp);
      const eventProp = isDynamic
        ? t.objectProperty(
            getEventName() as t.Expression,
            t.arrowFunctionExpression(
              [t.identifier('e')],
              t.blockStatement([t.expressionStatement(setterExpr)]),
            ),
            true,
          )
        : t.objectProperty(
            t.identifier(eventName as string),
            t.arrowFunctionExpression(
              [t.identifier('e')],
              t.blockStatement([t.expressionStatement(setterExpr)]),
            ),
          );

      return t.jsxSpreadAttribute(t.objectExpression([valueProp, eventProp]));
    }
    case VUE_DIR.show: {
      // v-show to style display
      return t.jsxAttribute(
        t.jsxIdentifier('style'),
        t.jsxExpressionContainer(
          t.objectExpression([
            t.objectProperty(
              t.identifier('display'),
              t.conditionalExpression(
                directive.babelExp!,
                t.stringLiteral(''),
                t.stringLiteral('none'),
              ),
            ),
          ]),
        ),
      );
    }
    case VUE_DIR.html: {
      // v-html 转为 dangerouslySetInnerHTML / v-html to dangerouslySetInnerHTML
      return t.jsxAttribute(
        t.jsxIdentifier('dangerouslySetInnerHTML'),
        t.jsxExpressionContainer(
          t.objectExpression([
            t.objectProperty(t.identifier('__html'), directive.babelExp as t.Expression),
          ]),
        ),
      );
    }
    case VUE_DIR.slot: {
      // Handle v-slot directive, convert to React children or named slot
      if (isUndefined(elementNode)) {
        return null;
      }

      let slotName: string | t.Expression = 'default';
      if (!isUndefined(directive.babelArgExp)) {
        // Dynamic slot name v-slot:[dynamicName]. because of babelArgExp = dynamicName
        slotName = directive.babelArgExp;
      } else if (directive.arg?.type === NodeTypes.SIMPLE_EXPRESSION) {
        // Static slot name v-slot:name
        slotName = directive.arg.content;
      }

      const children = transformChildren(elementNode.children as ExtendedNode[]);
      const slotContent =
        children.length === 1
          ? children[0]
          : t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children);

      // Handle scoped slot with complex expr like "{ title, desc }"
      let slotFunction: t.Expression | null = null;
      if (!isUndefined(directive.babelExp)) {
        const param = extractParamFromSlot(directive.babelExp);
        slotFunction = t.arrowFunctionExpression([param], slotContent as t.Expression);
      }

      // For default slot, only set jsxChildren, do not return attribute
      if (slotName === 'default') {
        elementNode.jsxChildren = slotFunction
          ? t.jsxExpressionContainer(slotFunction)
          : t.isJSXText(slotContent)
            ? t.jsxExpressionContainer(t.stringLiteral(slotContent.value))
            : slotContent;
        return null;
      }

      const finalValue =
        slotFunction ??
        (t.isJSXText(slotContent)
          ? t.stringLiteral(slotContent.value)
          : (slotContent as t.Expression));

      // Dynamic slot as spread attribute
      if (!isString(slotName) && t.isExpression(slotName)) {
        return t.jsxSpreadAttribute(
          t.objectExpression([t.objectProperty(slotName, finalValue, true)]),
        );
      }

      return t.jsxAttribute(
        t.jsxIdentifier(slotName as string),
        t.jsxExpressionContainer(slotFunction || t.arrowFunctionExpression([], finalValue)),
      );
    }
    case VUE_DIR.cloak: {
      return t.jsxAttribute(t.jsxIdentifier('style'), t.stringLiteral('display: none'));
    }
    default: {
      // Custom or unsupported
      logger.warn(directive, `Unsupported directive: ${directive.name}`);
      return null;
    }
  }
}
