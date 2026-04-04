import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { PACKAGE_NAME, VUE_PACKAGES } from '@consts/other';

export interface ImportStrategy {
  /** 判断是否匹配该策略 */
  matches(moduleName: string): boolean;

  /** 处理导入声明 */
  process(
    path: NodePath<t.ImportDeclaration>,
    ctx: ICompilationContext,
    moduleName: string,
  ): ImportStrategyResult;
}

export interface ImportStrategyResult {
  /** 是否应该替换源模块名 */
  shouldReplaceSource?: boolean;
  /** 替换后的模块名 */
  newSource?: string;
  /** 是否应该移除该导入声明 */
  shouldRemove?: boolean;
  /** 是否应该注入运行时依赖 */
  shouldInjectRuntimeImports?: boolean;
}

// Vue Router 策略：替换为 @vureact/router
export class VueRouterStrategy implements ImportStrategy {
  matches(moduleName: string): boolean {
    return moduleName === 'vue-router' || moduleName.startsWith('vue-router/');
  }

  process(): ImportStrategyResult {
    return {
      shouldReplaceSource: true,
      newSource: PACKAGE_NAME.router,
      shouldRemove: false,
      shouldInjectRuntimeImports: false,
    };
  }
}

// Vue 生态包策略：移除并注入运行时依赖
export class VueEcosystemStrategy implements ImportStrategy {
  matches(moduleName: string): boolean {
    // 排除相对/绝对路径导入
    if (
      moduleName.startsWith('.') ||
      moduleName.startsWith('/') ||
      moduleName.startsWith('file:')
    ) {
      return false;
    }

    // 排除 vue-router（由 VueRouterStrategy 处理）
    if (moduleName === 'vue-router' || moduleName.startsWith('vue-router/')) {
      return false;
    }

    // 检查是否是 Vue 生态包
    if (moduleName.startsWith('@vue/')) {
      return true;
    }

    // 检查包名是否在 VUE_PACKAGES 中
    for (const pkg of VUE_PACKAGES) {
      if (moduleName === pkg || moduleName.startsWith(`${pkg}/`)) {
        return true;
      }
    }

    return false;
  }

  process(): ImportStrategyResult {
    return {
      shouldReplaceSource: false,
      shouldRemove: true,
      shouldInjectRuntimeImports: true,
    };
  }
}

// 样式文件策略：.less/.sass/.scss -> .css
export class StyleFileStrategy implements ImportStrategy {
  private regExp = /\.(less|sass|scss)$/i;

  matches(moduleName: string): boolean {
    return this.regExp.test(moduleName);
  }

  process(path: NodePath<t.ImportDeclaration>, ctx: ICompilationContext): ImportStrategyResult {
    if (!ctx.preprocessStyles) {
      return {};
    }

    const importSource = path.node.source.value;
    if (typeof importSource !== 'string') {
      return {};
    }

    return {
      shouldReplaceSource: true,
      newSource: importSource.replace(this.regExp, '.css'),
      shouldRemove: false,
      shouldInjectRuntimeImports: false,
    };
  }
}
