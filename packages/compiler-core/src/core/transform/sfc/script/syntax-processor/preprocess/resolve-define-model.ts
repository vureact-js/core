import { ParseResult as BabelParseResult } from '@babel/core';
import { NodePath, TraverseOptions } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ADAPTER_RULES } from '@consts/adapters-map';
import { MACRO_API_NAMES, PACKAGE_NAME } from '@consts/other';
import { REACT_API_MAP } from '@consts/react-api-map';
import { recordImport } from '@core/transform/shared';
import { logger } from '@shared/logger';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import {
  expressionToTSType,
  isCalleeNamed,
  mapRuntimeTypeToTSType,
  replaceCallName,
} from '../../shared/babel-utils';
import { createUseEffect } from '../../shared/hook-creator';

export function resolveDefineModel(
  ctx: ICompilationContext,
  ast: BabelParseResult,
): TraverseOptions {
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
      const propInfo = extractPropInfo(node, ctx);

      // 将 defineModel 替换为 useVRef
      replaceToUseVRef(node, propInfo, ctx);

      // 引入 effect 自动更新
      resolveAutoUpdate(ast, path, propInfo, ctx);

      // 构造 TS 接口并加入上下文的 props 和 emits 中
      resolveInterface(propInfo, ctx);
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
  // 注意：CallExpression 的 parent 是 VariableDeclarator，不是 VariableDeclaration，
  // 需要通过 path.parentPath.parentPath 获取 VariableDeclaration
  const isValidVariableAssignment = (): boolean => {
    const varDeclaration = path.parentPath.parentPath;

    if (
      varDeclaration?.isVariableDeclaration() &&
      varDeclaration.node.declarations.length === 1 &&
      t.isArrayPattern(varDeclaration.node.declarations[0]?.id)
    ) {
      logger.error(
        `defineModel return value cannot be destructured with array pattern. Please use single variable assignment.`,
        {
          file: filename,
          source: scriptData.source,
          loc: varDeclaration.node.loc,
        },
      );

      return false;
    }

    return true;
  };

  return !hasUnsupportedOption(arg1) && !hasUnsupportedOption(arg2) && isValidVariableAssignment();
}

type PropInfo = {
  /**
   * @default 'modelValue'
   */
  name: string;
  /**
   * @default 'onUpdateModelValue'
   */
  updateEventName: string;
  type?: t.TSType;
  required: boolean;
  default?: t.Expression | t.PatternLike;
};

function extractPropInfo(node: t.CallExpression, ctx: ICompilationContext): PropInfo {
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

    if (defaultProp) {
      result.default = defaultProp.value;
    }

    if (requiredProp && t.isBooleanLiteral(requiredProp.value)) {
      result.required = requiredProp.value.value;
    }

    // 尝试将选项中的 type 转换为 ts 类型
    if (typeProp && t.isIdentifier(typeProp.value)) {
      result.type = mapRuntimeTypeToTSType(typeProp.value);
    } else if (node.typeParameters) {
      // 如果 defineModel 存在类型参数，且未在选项中声明 type，
      // 则尝试从类型参数中提取类型信息
      const [typeParam] = node.typeParameters.params;
      if (t.isTSType(typeParam)) {
        result.type = typeParam;
      }
    } else if (defaultProp) {
      // 兜底：尝试将 default 选项的值转换成 ts 类型
      result.type = expressionToTSType(defaultProp.value as t.Expression);
    }

    return result;
  };

  // 安全合并：仅覆盖有实际值的属性，避免 undefined 覆盖默认值
  const safeAssign = (target: PropInfo, source: Partial<PropInfo>) => {
    if (source.name !== undefined) {
      target.name = source.name;
    }
    if (source.updateEventName !== undefined) {
      target.updateEventName = source.updateEventName;
    }
    if (source.type !== undefined) {
      target.type = source.type;
    }
    if (source.required !== undefined) {
      target.required = source.required;
    }
    if (source.default !== undefined) {
      target.default = source.default;
    }
  };

  // 提取类型参数的辅助函数（当没有对象参数显式提供 type 时使用）
  const extractTypeFromTypeParams = (info: Partial<PropInfo>) => {
    if (!node.typeParameters) return;

    // 仅当当前 type 是默认的 any（即未被对象参数覆盖）时，才从类型参数提取
    const isDefaultAny = !info.type || t.isTSAnyKeyword(info.type as t.TSType);
    if (!isDefaultAny) return;

    const [typeParam] = node.typeParameters.params;
    if (t.isTSType(typeParam)) {
      info.type = typeParam;
    }
  };

  // 直接提取首个参数的 prop name
  if (t.isStringLiteral(arg1)) {
    setPropName(propInfo, arg1.value);
    // 当第一个参数是字符串时，类型信息只能来自类型参数
    extractTypeFromTypeParams(propInfo);
  } else if (t.isObjectExpression(arg1)) {
    // 从选项中提取信息
    safeAssign(propInfo, extractPropInfoFromObject(arg1));
  }

  // 当第二个参数存在且为选项
  if (!t.isObjectExpression(arg1) && t.isObjectExpression(arg2)) {
    safeAssign(propInfo, extractPropInfoFromObject(arg2));
  }

  return propInfo;
}

function replaceToUseVRef(node: t.CallExpression, propInfo: PropInfo, ctx: ICompilationContext) {
  const refAdapter = ADAPTER_RULES.runtime.ref!;

  replaceCallName(node, refAdapter.target);
  recordImport(ctx, refAdapter.package, refAdapter.target);

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
}

function resolveAutoUpdate(
  ast: BabelParseResult,
  path: NodePath<t.CallExpression>,
  propInfo: PropInfo,
  ctx: ICompilationContext,
) {
  // CallExpression 的 parent 是 VariableDeclarator，不是 VariableDeclaration
  const { parent } = path;

  // 仅处理有变量声明接收返回值的，如: const model = defineModel()
  // 从 VariableDeclarator 获取其 id
  if (!t.isVariableDeclarator(parent)) {
    return;
  }

  // 获取变量名（直接从 VariableDeclarator 的 id 取值）
  const modelId = parent.id;
  if (!t.isIdentifier(modelId)) {
    return;
  }

  // 构建 props 成员表达式 props.onUpdateXxx
  const memberAccess = t.memberExpression(
    t.identifier(ctx.propField),
    t.identifier(propInfo.updateEventName),
  );

  // 构建依赖项
  const dep = t.memberExpression(modelId, t.identifier('value'));

  // 构建调用表达式 props.onUpdateXxx?.(model.value)
  const updateCall = t.optionalCallExpression(memberAccess, [dep], true);

  // 构建 useEffect 调用
  const callExpr = createUseEffect(
    // @ts-expect-error
    t.blockStatement([t.expressionStatement(updateCall)]),
    t.arrayExpression([dep]),
  );

  // 将 effect 插入到 ast 尾部
  ast.program.body.push(t.expressionStatement(callExpr));

  recordImport(ctx, PACKAGE_NAME.react, REACT_API_MAP.useEffect);
}

function resolveInterface(propInfo: PropInfo, ctx: ICompilationContext) {
  const { name, updateEventName, required } = propInfo;
  const { lang, propsTSIface } = ctx.scriptData;

  if (!lang.startsWith('ts')) {
    return;
  }

  // 生成类型签名分别加入 propsTSIface.propsTypes 和 propsTSIface.emitTypes
  // [propInfo.name]?: propInfo.type
  // [propInfo.updateEventName]?: (arg: propInfo.type) => void
  // 是否可选根据 propInfo.required

  const propType = propInfo.type || t.tsAnyKeyword();

  const propSignature = t.tsPropertySignature(
    t.isValidIdentifier(name) ? t.identifier(name) : t.stringLiteral(name),
    t.tsTypeAnnotation(propType),
  );
  propSignature.optional = !required;

  const emitArg = t.identifier('arg');
  emitArg.typeAnnotation = t.tsTypeAnnotation(propType);

  const emitSignature = t.tsPropertySignature(
    t.isValidIdentifier(updateEventName)
      ? t.identifier(updateEventName)
      : t.stringLiteral(updateEventName),
    t.tsTypeAnnotation(t.tsFunctionType(null, [emitArg], t.tsTypeAnnotation(t.tsVoidKeyword()))),
  );
  emitSignature.optional = true;

  // 将 prop/emit 签名追加到已有的 TSTypeLiteral 中，而不是每个签名单独创建新块，
  // 避免生成多个 & 连接导致类型定义混乱（如：PropsType1 & PropsType2 & EmitType1 & EmitType2）
  const appendToTypeLiteral = (list: t.TSType[], member: t.TSTypeElement) => {
    // 尝试查找列表中已有的 TSTypeLiteral 并追加 members
    const existing = list.find((item) => t.isTSTypeLiteral(item)) as t.TSTypeLiteral | undefined;
    if (existing) {
      existing.members.push(member);
    } else {
      list.push(t.tsTypeLiteral([member]));
    }
  };

  appendToTypeLiteral(propsTSIface.propsTypes, propSignature);
  appendToTypeLiteral(propsTSIface.emitTypes, emitSignature);
}
