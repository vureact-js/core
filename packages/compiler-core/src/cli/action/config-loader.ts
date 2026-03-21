import { CompilerOptions } from '@compiler/index';
import { existsSync } from 'fs';
import kleur from 'kleur';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * 加载用户配置文件
 */
export async function loadUserConfig(root: string): Promise<CompilerOptions> {
  // 尝试加载 TypeScript 配置文件
  const tsConfigPath = path.resolve(root, 'vureact.config.ts');
  const jsConfigPath = path.resolve(root, 'vureact.config.js');

  if (existsSync(tsConfigPath)) {
    return await loadTSConfig(tsConfigPath);
  }

  if (existsSync(jsConfigPath)) {
    return await loadJSConfig(jsConfigPath);
  }

  return {};
}

/**
 * 加载 TypeScript 配置文件
 */
async function loadTSConfig(configPath: string): Promise<CompilerOptions> {
  try {
    // 动态导入 tsx 来支持 TypeScript 文件
    const { register } = await import('tsx/esm/api');

    // 注册 TypeScript 支持
    register();

    // 使用 pathToFileURL 解决 Windows 绝对路径无法直接 import 的问题
    const configUrl = pathToFileURL(configPath).href;
    const module = await import(configUrl);
    // 处理 export default 或 module.exports
    return module.default || module;
  } catch (err) {
    console.warn(
      kleur.yellow('⚠️'),
      `Load TypeScript config failed at ${configPath}, using default options`,
    );
    console.error(err);
    return {};
  }
}

/**
 * 加载 JavaScript 配置文件
 */
async function loadJSConfig(configPath: string): Promise<CompilerOptions> {
  try {
    // 使用 pathToFileURL 解决 Windows 绝对路径无法直接 import 的问题
    const configUrl = pathToFileURL(configPath).href;
    const module = await import(configUrl);
    // 处理 export default 或 module.exports
    return module.default || module;
  } catch (err) {
    console.warn(
      kleur.yellow('⚠️'),
      `Load JavaScript config failed at ${configPath}, using default options`,
      err,
    );
    return {};
  }
}
