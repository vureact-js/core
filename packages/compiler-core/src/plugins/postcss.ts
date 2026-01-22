import postcss from 'postcss';

interface Result {
  css: string;
  scopeId: string;
}

export function processScopedWithPostCss(input: string, hash: string): Result {
  const scopeId = `data-css-${hash}`;

  // 完全同步的选择器转换插件，只做 scoped 这种简单的 AST 变换
  const result = postcss([
    {
      postcssPlugin: 'postcss-scoped-simple',
      Rule(rule) {
        // 排除掉 @keyframes 内部的 rule 等特殊情况
        if (
          rule.parent &&
          rule.parent.type === 'atrule' &&
          (rule.parent as any).name === 'keyframes'
        ) {
          return;
        }

        // 处理选择器名称
        rule.selectors = rule.selectors.map((selector) => {
          // 1. 处理全局选择器 :global
          if (selector.includes(':global(')) {
            return selector.replace(/:global\((.*)\)/, '$1');
          }

          // 2. 处理深度选择器 :deep
          if (selector.includes(':deep(')) {
            return selector.replace(/:deep\((.*)\)/, '$1');
          }

          // 3. 处理伪元素 (::before, ::after, ::first-line 等)
          // 复杂的做法是用 postcss-selector-parser，简单的做法是用正则拆分
          const pseudoElementRegex = /(::[a-zA-Z-]+)$/;
          const match = selector.match(pseudoElementRegex);

          if (match) {
            const base = selector.replace(pseudoElementRegex, '');
            const pseudo = match[1];
            return `${base}[${scopeId}]${pseudo}`;
          }

          // 4. 普通情况
          return `${selector}[${scopeId}]`;
        });
      },
    },
  ]).process(input);

  return {
    css: result.css,
    scopeId,
  };
}
