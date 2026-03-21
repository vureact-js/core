import { RUNTIME_PACKAGES, VUE_PACKAGES } from '@consts/other';
import { execSync } from 'child_process';
import fs from 'fs';
import kleur from 'kleur';
import ora from 'ora';
import { FileCompiler } from '.';
import { CompilerOptions } from '../types';

/**
 * Vite 环境初始化管理器
 */
export class ViteBootstrapper {
  private spinner = ora();
  private defaultConfig = {
    template: 'react-ts',
    viteVersion: '@latest',
    reactVersion: '^19.2.0',
  };

  constructor(
    private fileCompiler: FileCompiler,
    private options: CompilerOptions,
  ) {}

  /**
   * 检查是否需要初始化 Vite 环境
   */
  private isSingleFile(): boolean {
    const inputPath = this.fileCompiler.getInputPath();

    if (!fs.existsSync(inputPath)) {
      return false;
    }

    const stat = fs.statSync(inputPath);
    return stat.isFile();
  }

  /**
   * 利用 Vite 官方脚手架创建标准 React 环境
   */
  async bootstrapIfNeeded(): Promise<boolean> {
    const { bootstrapVite } = this.options.output || {};
    const workspaceDir = this.fileCompiler.getWorkspaceDir();

    // 默认创建工作区目录
    await fs.promises.mkdir(workspaceDir, { recursive: true });

    // 检查是否应该初始化 Vite
    if (bootstrapVite === false) {
      return false;
    }

    // 如果是单个文件，跳过 Vite 初始化
    if (this.isSingleFile()) {
      console.info('Skipping Vite initialization for single file compilation');
      return false;
    }

    const outputPkgPath = this.fileCompiler.getOutputPkgPath();

    // 如果 package.json 已存在，说明环境初始化过了
    if (fs.existsSync(outputPkgPath)) {
      return false;
    }

    this.spinner.start('Bootstrapping Vite React environment...');

    try {
      await this.resolveViteCreateApp();
    } catch (err) {
      this.spinner.stop();

      console.error(
        kleur.red('✖'),
        'Failed to bootstrap Vite environment. Please check npm/network.',
        err,
      );

      return false;
    }

    // 智能剔除原项目中的 Vue 强绑定包，避免带到 React 环境
    const removeVuePackages = (deps: Record<string, any>) => {
      for (const name in deps) {
        const isVueLike = VUE_PACKAGES.some((n) => name.includes(n));
        if (isVueLike) {
          delete deps[name];
        }
      }
    };

    // 继承业务依赖，并注入 React 运行时必需的组件
    const resolveDeps = (root: Record<string, any>, vite: Record<string, any>, isDev = false) => {
      // 先移除 Vue like 包再合并，防止误删 react 环境的包
      removeVuePackages(root);

      const deps = {
        ...root,
        ...vite,
      };

      if (!isDev) {
        const { runtime } = RUNTIME_PACKAGES;
        deps[runtime.name] = runtime.version;
      }

      return deps;
    };

    // 读取原 package.json
    const rootPkgPath = this.fileCompiler.getRootPkgPath();
    const rootPkg = await this.fileCompiler.resolvePackageFile(rootPkgPath);

    // 读取输出路径的 package.json
    const vitePkg = await this.fileCompiler.resolvePackageFile(outputPkgPath);

    // 执行依赖合并
    const newDeps = resolveDeps(rootPkg.dependencies, vitePkg.dependencies);
    const newDevDeps = resolveDeps(rootPkg.devDependencies, vitePkg.devDependencies, true);

    // 更新 package.json
    vitePkg.dependencies = newDeps;
    vitePkg.devDependencies = newDevDeps;

    // 写入新数据到 vite 项目的 package.json
    const newVitePkg = JSON.stringify(vitePkg, null, 2);
    await this.fileCompiler.writeFileWithDir(outputPkgPath, newVitePkg);

    this.spinner.succeed('Standard Vite React environment initialized');

    return true;
  }

  /**
   * 执行 vite 创建命令
   */
  private async resolveViteCreateApp() {
    const { output } = this.options;
    const { viteVersion, reactVersion, template: tmpl } = this.defaultConfig;

    const bootstrapVite = output?.bootstrapVite;
    const outDirName = this.fileCompiler.getOutDirName();
    const configObject = typeof bootstrapVite === 'object' ? bootstrapVite : null;

    const viteVer = configObject?.vite || viteVersion;
    const reactVer = configObject?.react || reactVersion;
    const template = configObject?.template || tmpl;

    // 执行 vite 创建命令，使用 --template xxx 跳过交互式选择
    const cmd = `npm create vite${viteVer} ${outDirName} -- --template ${template}`;

    execSync(cmd, {
      cwd: this.fileCompiler.getWorkspaceDir(),
      stdio: 'ignore', // 隐藏 create-vite 内部的输出日志，保持终端整洁
    });

    await this.resolveReactVersion(reactVer);
  }

  /**
   * 处理 React 包版本
   * @param ver 版本号
   */
  private async resolveReactVersion(ver: string) {
    const outputPkgPath = this.fileCompiler.getOutputPkgPath();
    const vitePkg = await this.fileCompiler.resolvePackageFile(outputPkgPath);

    // 类型包使用 react 主版本号
    const typesVer = `^${ver.split('.')[0]!.replace(/@|\^/, '')}.0.0`;

    vitePkg.dependencies.react = ver;
    vitePkg.dependencies['react-dom'] = ver;
    vitePkg.devDependencies['@types/react'] = typesVer;
    vitePkg.devDependencies['@types/react-dom'] = typesVer;

    await this.fileCompiler.writeFileWithDir(outputPkgPath, JSON.stringify(vitePkg, null, 2), {
      lock: true,
    });
  }
}
