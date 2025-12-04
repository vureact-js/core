export interface VForParseResult {
  source: string;
  value: string;
  key?: string;
  index?: string;
  isDestructured: boolean;
  destructuringType?: 'object' | 'array';
}

/**
 * 解析 v-for 表达式所有合法形式
 * @param expression - v-for 完整表达式，如 "(todo, index) in todoList"
 * @returns 解析结果
 * @throws 语法错误
 */
export function parseVForExp(expression: string): VForParseResult {
  /**
   * 智能分割参数列表，不破坏解构语法
   * @example
   *   "{ a, b }, index"  → ["{ a, b }", "index"]
   *   "[first], i"       → ["[first]", "i"]
   */
  const splitParamsRespectingDestructuring = (paramStr: string): string[] => {
    const params: string[] = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < paramStr.length; i++) {
      const char = paramStr[i];

      if (char === '{' || char === '[') depth++;
      if (char === '}' || char === ']') depth--;

      if (char === ',' && depth === 0) {
        params.push(paramStr.slice(start, i).trim());
        start = i + 1;
      }
    }

    params.push(paramStr.slice(start).trim());
    return params.filter((p) => p.length > 0);
  };

  /** 检测是否为解构模式 */
  const isDestructuringPattern = (str: string): boolean => {
    return str.startsWith('{') || str.startsWith('[');
  };

  /** 获取解构类型 */
  const getDestructuringType = (str: string): 'object' | 'array' | undefined => {
    if (str.startsWith('{')) return 'object';
    if (str.startsWith('[')) return 'array';
    return undefined;
  };

  // 1. 标准化表达式，支持 in/of 两种写法
  const normalized = expression.trim();

  // 2. 匹配 left in|of right 模式
  const match = normalized.match(/^(.*?)\s+(?:in|of)\s+(.+)$/)!;

  const left = match[1]?.trim() || '';
  const source = match[2]?.trim() || '';

  // 3. 提取参数列表（支持有/无括号两种形式）
  const hasParens = left.startsWith('(') && left.endsWith(')');
  const paramStr = hasParens ? left.slice(1, -1).trim() : left;

  // 4. 智能分割参数（尊重解构边界，不破坏 { a, b } 内的逗号）
  const params = splitParamsRespectingDestructuring(paramStr);

  // 6. 构建解析结果
  const value = params[0]!;
  const result: VForParseResult = {
    source,
    value,
    isDestructured: isDestructuringPattern(value),
    destructuringType: getDestructuringType(value),
  };

  // 7. 处理第二个参数（可能是 key 或 index）
  if (params.length > 1) {
    result.key = params[1];
  }

  // 8. 处理第三个参数（仅限 index）
  if (params.length > 2) {
    result.index = params[2];
  }

  return result;
}
