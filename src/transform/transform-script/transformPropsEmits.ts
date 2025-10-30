import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { VUE_REACTIVE_APIS } from '@constants/vue';
import { capitalize } from '@transform/utils';
import { logger } from '@transform/utils/logger';
import { isNull, isUndefined } from '@utils/types';
import type { EmitDefinition, PropDefinition, ScriptTransformContext } from './types';

export function transformDefinePropsEmits(ast: t.File, ctx: ScriptTransformContext) {
  traverse(ast, {
    VariableDeclaration(path) {
      const { declarations } = path.node;
      declarations.forEach((decl) => {
        if (t.isVariableDeclarator(decl) && t.isCallExpression(decl.init)) {
          const { callee } = decl.init;
          if (t.isIdentifier(callee)) {
            const { name } = callee;
            if (name === VUE_REACTIVE_APIS.defineProps) {
              handleDefineProps(decl, ctx);
              path.remove();
            } else if (name === VUE_REACTIVE_APIS.defineEmits) {
              handleDefineEmits(decl, ctx);
              path.remove();
            }
          }
        }
      });
    },
  });
}

function handleDefineProps(decl: t.VariableDeclarator, ctx: ScriptTransformContext) {
  if (!t.isCallExpression(decl.init)) {
    logger.error(decl, 'Invalid defineProps call; skipping extraction');
    return;
  }

  // 统一 arg（arguments[0] 或 typeParameters.params[0]）
  // Unify arg
  const arg = decl.init.arguments[0] ?? decl.init.typeParameters?.params[0] ?? null;
  if (isNull(arg)) {
    logger.error(decl, 'No value passed to defineProps; no props extracted');
    return;
  }

  if (t.isObjectExpression(arg)) {
    // Option { title: { type: String, required: true } }
    arg.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const name = prop.key.name;
        const value = prop.value;
        let type: PropDefinition['type'] = t.tsAnyKeyword(); // default any type
        let required = false;
        let defaultValue: PropDefinition['defaultValue'];

        if (t.isObjectExpression(value)) {
          value.properties.forEach((p) => {
            if (t.isObjectProperty(p) && t.isIdentifier(p.key)) {
              if (p.key.name === 'type') {
                type = vueTypeToTsType(p.value as t.Expression);
              } else if (p.key.name === 'required') {
                required = t.isBooleanLiteral(p.value) ? p.value.value : false;
              } else if (p.key.name === 'default') {
                defaultValue = p.value as t.Expression;
              }
            }
          });
        } else {
          logger.warn(
            value,
            `Prop "${name}" lacks type/required/default config; defaulting to any/non-required/no-default`,
          );
        }
        ctx.props.push({ name, type, required, defaultValue });
      }
    });
  } else if (t.isTSTypeLiteral(arg) || t.isTSInterfaceDeclaration(arg)) {
    // TS 泛型式 <{ title: string }> / TS generic
    // Extract TS types
    arg.members.forEach((member) => {
      if (t.isTSPropertySignature(member) && t.isIdentifier(member.key)) {
        const name = member.key.name;
        const type = member.typeAnnotation?.typeAnnotation || t.tsAnyKeyword();
        const required = !member.optional;
        ctx.props.push({ name, type, required });
      }
    });
  } else {
    logger.error(arg, 'Unsupported defineProps arg type; skipping extraction');
  }

  if (!ctx.props.length) {
    logger.warn(arg, 'No valid props extracted from defineProps; empty props array');
  }
}

function handleDefineEmits(decl: t.VariableDeclarator, ctx: ScriptTransformContext) {
  if (!t.isCallExpression(decl.init)) {
    logger.error(decl, 'Invalid defineEmits call: Init is not CallExpression');
    return;
  }

  const arg = decl.init.arguments[0] ?? decl.init.typeParameters?.params[0] ?? null;
  if (isNull(arg)) {
    logger.error(decl, 'No value passed to defineEmits');
    return;
  }

  if (t.isObjectExpression(arg)) {
    // Option form { 'update:title': null }
    arg.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isStringLiteral(prop.key)) {
        const rawEventName = prop.key.value;
        const eventName = vueEventToReact(rawEventName); // example: update:title → onUpdate_Title
        const parameters: EmitDefinition['parameters'] = []; // Default no params
        if (prop.value && t.isArrayExpression(prop.value)) {
          prop.value.elements.forEach((el, i) => {
            if (!isNull(el) && t.isTSTypeAnnotation(el)) {
              parameters.push({
                name: `value${i}`,
                type: (el as t.TSTypeAnnotation).typeAnnotation,
              });
            } else {
              logger.warn(
                prop.value,
                `defineEmits ArrayExpression element not TSTypeAnnotation; ignoring param type`,
              );
            }
          });
        } else {
          logger.warn(prop.value, `defineEmits prop value not ArrayExpression; default no params`);
        }
        ctx.emits.push({ eventName, rawEventName, parameters });
      } else {
        logger.warn(prop, 'defineEmits ObjectExpression prop has invalid key; skipping');
      }
    });
  } else if (t.isTSTypeLiteral(arg) || t.isTSInterfaceDeclaration(arg)) {
    // TS 式 <{ 'update:title': [value: string] }>
    arg.members.forEach((member) => {
      if (
        t.isTSPropertySignature(member) &&
        (t.isIdentifier(member.key) || t.isStringLiteral(member.key))
      ) {
        const rawEventName = t.isIdentifier(member.key)
          ? member.key.name.replace(/([A-Z])/g, '-$1').toLowerCase()
          : member.key.value;

        const eventName = vueEventToReact(rawEventName);
        const parameters: EmitDefinition['parameters'] = [];
        if (!isUndefined(member.typeAnnotation?.typeAnnotation)) {
          const typeAnno = member.typeAnnotation.typeAnnotation;

          if (t.isTSFunctionType(typeAnno)) {
            typeAnno.parameters.forEach((param) => {
              if (t.isIdentifier(param)) {
                const paramName = param.name;
                const paramType = param.typeAnnotation
                  ? (param.typeAnnotation as t.TSTypeAnnotation).typeAnnotation
                  : t.tsAnyKeyword();
                parameters.push({ name: paramName, type: paramType });
              }
            });
          } else if (t.isTSTupleType(typeAnno)) {
            typeAnno.elementTypes.forEach((elementType, index) => {
              let paramName = `value${index}`;
              let paramType: t.TSType | t.TSNamedTupleMember = elementType;

              // 如果是命名元组成员，使用其标签名
              if (t.isTSNamedTupleMember(elementType)) {
                paramName = t.isIdentifier(elementType.label)
                  ? elementType.label.name
                  : `value${index}`;
                paramType = elementType;
              }

              parameters.push({ name: paramName, type: paramType });
            });
          } else {
            logger.warn(
              typeAnno,
              `defineEmits TSPropertySignature type not TSFunctionType/TSTupleType; default no params`,
            );
          }
        }
        ctx.emits.push({ eventName, rawEventName, parameters, optional: !member.optional });
      } else {
        logger.warn(member, 'defineEmits TSTypeLiteral member not TSPropertySignature; skipping');
      }
    });
  } else {
    logger.warn(arg, 'Unsupported defineEmits arg type; skipping extraction');
  }
}

function vueEventToReact(event: string): string {
  // 支持 : / - 分隔（统一处理 kebab/colon）
  // Support : / - split (unify kebab/colon)
  const parts = event.split(/[:\-]/);
  // example: 'click' → 'onClick'
  if (parts.length <= 1) return 'on' + capitalize(event);
  // 'update:title' or 'update-title' → 'onUpdate_Title'
  const first = 'on' + capitalize(parts[0] ?? 'undefined');
  const rest = parts.slice(1).map(capitalize);
  return first + (rest.length ? `_${rest.join('_')}` : '');
}

function vueTypeToTsType(vueType: t.Expression): t.TSType {
  if (t.isIdentifier(vueType)) {
    switch (vueType.name) {
      case 'String':
        return t.tsStringKeyword();
      case 'Number':
        return t.tsNumberKeyword();
      case 'Boolean':
        return t.tsBooleanKeyword();
      case 'Object':
        return t.tsObjectKeyword();
      case 'Null':
        return t.tsNullKeyword();
      case 'Undefined':
        return t.tsUndefinedKeyword();
      case 'Bigint':
        return t.tsBigIntKeyword();
      case 'Symbol':
        return t.tsSymbolKeyword();
      default:
        logger.warn(
          vueType,
          `Unrecognized Vue type '${vueType.name}' in defineProps; defaulting to any`,
        );
        return t.tsAnyKeyword();
    }
  } else {
    logger.warn(vueType, 'Vue type in defineProps not Identifier; defaulting to any');
  }
  return t.tsAnyKeyword();
}
