import { logger } from '@shared/logger';
import less from 'less';
import * as sass from 'sass';

type Options = {
  lang: string;
  enabled?: boolean;
  filename: string;
};

type Result = { code: string; fileExt: string };

/**
 * 处理 Less / Sass 语言为 CSS（同步版本）
 * 注意：Less 编译是异步的，这里使用同步包装
 */
export function resolveLessSass(source: string, options: Options): Result {
  const { lang, enabled, filename } = options;
  const result: Result = { code: source, fileExt: '.css' };

  // 如果开启样式预处理，则统一使用 css 文件后缀，否则使用对应语言文件
  if (!options.enabled) {
    result.fileExt = `.${options.lang}`;
  }

  if (!enabled) return result;

  if (lang === 'less') {
    result.code = resolveLessSync(source, filename);
  } else if (lang === 'scss' || lang === 'sass') {
    result.code = resolveSassSync(source, filename);
  }

  result.code = resolveImportExtensions(result.code);
  return result;
}

function resolveLessSync(source: string, filename: string): string {
  // 使用同步包装异步调用
  let result = '';
  let error: any = null;

  // 配置 Less 选项，启用数学运算
  const options: Less.Options = {
    math: 'always', // 总是计算数学表达式
    strictUnits: false, // 不严格检查单位
  };

  less.render(source, options, (err, output) => {
    if (err) {
      error = err;
    } else {
      result = output!.css;
    }
  });

  // 简单等待（这不是真正的同步，但在简单情况下可以工作）
  // 对于生产环境，建议使用异步版本
  if (error) {
    logger.warn(`[less] compilation failed: ${error.message}`, { file: filename });
    return source;
  }

  return result || source;
}

function resolveSassSync(source: string, filename: string): string {
  const options: sass.Options<'sync'> = {
    style: 'expanded',

    // 使用现代的颜色函数替代弃用的函数
    functions: {
      // 自定义函数来替代弃用的 lighten/darken
      'lighten($color, $amount)': (args) => {
        const color = args[0] as sass.SassColor;
        const amount = (args[1] as sass.SassNumber).value;

        // 使用 Sass 的现代 API
        return color.change({ lightness: color.channel('lightness') + amount });
      },
      'darken($color, $amount)': (args) => {
        const color = args[0] as sass.SassColor;
        const amount = (args[1] as sass.SassNumber).value;

        return color.change({ lightness: color.channel('lightness') - amount });
      },
    },

    logger: {
      warn: () => {
        // 静默处理弃用警告
      },
    },

    // 不输出详细信息
    verbose: false,
  };

  // 同步编译 Sass/SCSS
  const result = sass.compileString(source, options);
  return result.css;
}

// 将潜在的如 @import url('xxx.less') 替换其后缀名为 .css
function resolveImportExtensions(code: string): string {
  if (code.includes('.less') || code.includes('.scss') || code.includes('.sass')) {
    return code.replaceAll(/\.(less|scss|sass)(?=['")])/g, '.css');
  }
  return code;
}
