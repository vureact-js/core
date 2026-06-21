import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { MACRO_API_NAMES } from '@consts/other';
import { VUE_API_MAP } from '@consts/vue-api-map';
import { logger } from '@shared/logger';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { isCalleeNamed, mapRuntimeTypeToTSType, replaceCallName } from '../../shared/babel-utils';

export function resolveDefineModel(ctx: ICompilationContext): TraverseOptions {
  if (ctx.inputType !== 'sfc') return {};

  return {
    CallExpression(path) {
      const { node } = path;

      if (!isCalleeNamed(node, MACRO_API_NAMES.model)) {
        return;
      }

      // 验证参数选项 & 变量接收形式
      if (!validateDefineModelUsage(path, ctx)) {
        return;
      }

      // 提取 prop name、类型、默认值
      const propInfo = extractPropInfo(node);

      // 构造 TS 接口并加入上下文的 props 和 emits 中
      // TODO

      // 将 defineModel 替换为 ref，方便后续处理成 useVRef
      rewriteToVueRef(node, propInfo, ctx);

      // 在 script 底部插入 useEffect + props.onUpdateXxx
      // TODO
    },
  };
}

function validateDefineModelUsage(
  path: NodePath<t.CallExpression>,
  ctx: ICompilationContext,
): boolean {
  const { node, parent } = path;
  const { filename, scriptData } = ctx;
  const [arg1, arg2] = node.arguments;

  // 若直接定义 prop name 则必须是字符串字面量：defineMode('string')
  if (!t.isObjectExpression(arg1) && !t.isStringLiteral(arg1)) {
    logger.error(`Invalid argument type for defineModel. Expected a string.`, {
      file: filename,
      source: scriptData.source,
      loc: arg1?.loc,
    });
    return false;
  }

  // 检查是否存在 get/set/validator 选项（不支持）
  const hasUnsupportedOption = (arg: any): boolean => {
    if (!t.isObjectExpression(arg)) {
      return false;
    }

    const result = arg.properties.some((prop) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const keyName = prop.key.name;

        if (keyName === 'get' || keyName === 'set' || keyName === 'validator') {
          logger.error(`defineModel does not support '${keyName}' option.`, {
            file: filename,
            source: scriptData.source,
            loc: prop.key.loc,
          });

          return true;
        }
      }
    });

    return !!result;
  };

  // 检查变量接收形式是否为数组解构（不支持）
  const isValidVariableAssignment = (): boolean => {
    if (
      t.isVariableDeclaration(parent) &&
      parent.declarations.length === 1 &&
      t.isArrayPattern(parent.declarations[0]?.id)
    ) {
      logger.error(
        `defineModel return value cannot be destructured with array pattern. Please use single variable assignment.`,
        {
          file: filename,
          source: scriptData.source,
          loc: parent.loc,
        },
      );

      return false;
    }

    return true;
  };

  return !hasUnsupportedOption(arg1) && !hasUnsupportedOption(arg2) && isValidVariableAssignment();
}

type PropInfo = {
  name: string;
  updateEventName: string;
  type?: t.TSType;
  required: boolean;
  default?: t.Expression | t.PatternLike;
};

function extractPropInfo(node: t.CallExpression): PropInfo {
  const [arg1, arg2] = node.arguments;

  const propInfo: PropInfo = {
    name: 'modelValue',
    updateEventName: 'onUpdateModelValue',
    type: undefined,
    required: false,
    default: undefined,
  };

  const findObjectProperty = (
    objExpr: t.ObjectExpression,
    propName: string,
  ): t.ObjectProperty | undefined => {
    return objExpr.properties.find(
      (prop) => t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === propName,
    ) as t.ObjectProperty | undefined;
  };

  const setPropName = (info: Partial<PropInfo>, value: string) => {
    if (!value.trim()) return;
    info.name = value;
    info.updateEventName = `onUpdate${capitalize(camelCase(value))}`;
  };

  // 提取目标 prop 属性（name/type/default/required）
  const extractPropInfoFromObject = (objExpr: t.ObjectExpression): Partial<PropInfo> => {
    const result: Partial<PropInfo> = {};

    const nameProp = findObjectProperty(objExpr, 'name');
    const typeProp = findObjectProperty(objExpr, 'type');
    const defaultProp = findObjectProperty(objExpr, 'default');
    const requiredProp = findObjectProperty(objExpr, 'required');

    if (nameProp && t.isStringLiteral(nameProp.value)) {
      setPropName(result, nameProp.value.value);
    }

    if (typeProp && t.isIdentifier(typeProp.value)) {
      result.type = mapRuntimeTypeToTSType(typeProp.value);
    }

    if (defaultProp) {
      result.default = defaultProp.value;
    }

    if (requiredProp && t.isBooleanLiteral(requiredProp.value)) {
      result.required = requiredProp.value.value;
    }

    return result;
  };

  // 直接提取首个参数的 prop name
  if (t.isStringLiteral(arg1)) {
    setPropName(propInfo, arg1.value);
  } else if (t.isObjectExpression(arg1)) {
    // 从选项中提取信息
    Object.assign(propInfo, extractPropInfoFromObject(arg1));
  }

  // 当第二个参数存在且为选项
  if (!t.isObjectExpression(arg1) && t.isObjectExpression(arg2)) {
    Object.assign(propInfo, extractPropInfoFromObject(arg2));
  }

  return propInfo;
}
function rewriteToVueRef(node: t.CallExpression, propInfo: PropInfo, ctx: ICompilationContext) {
  const defaultValue = propInfo.default as t.Expression;
  const propRef = t.identifier(`${ctx.propField}.${propInfo.name}`);

  // 构造新的调用参数
  if (!defaultValue) {
    node.arguments = [propRef];
  } else {
    node.arguments = [t.logicalExpression('??', propRef, defaultValue)];
  }

  // 在 TS 环境下如果当前调用没有类型参数，
  // 则使用 propInfo.type 进行构造，模拟类型自动推导
  if (ctx.scriptData.lang.startsWith('ts') && !node.typeParameters && propInfo.type) {
    node.typeParameters = t.tsTypeParameterInstantiation([propInfo.type]);
  }

  replaceCallName(node, VUE_API_MAP.ref);
}
