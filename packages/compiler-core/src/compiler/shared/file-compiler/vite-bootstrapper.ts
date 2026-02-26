import { execSync } from 'child_process';
import fs from 'fs';
import kleur from 'kleur';
import ora from 'ora';
import path from 'path';
import { Helper } from '../helper';
import { CompilerOptions } from '../types';

/**
 * Vite 环境初始化管理器
 */
export class ViteBootstrapper {
  private spinner = ora();
  private pkgs = {
    runtime: {
      name: '@vureact-runtime',
      version: '^1.0.0',
    },
  };

  constructor(
    private helper: Helper,
    private options: CompilerOptions,
  ) {}

  /**
   * 检查是否需要初始化 Vite 环境
   */
  private isSingleFile(): boolean {
    const inputPath = this.helper.getInputPath();

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

    // 检查是否应该初始化 Vite
    if (bootstrapVite === false) {
      return false;
    }

    // 如果是单个文件，跳过 Vite 初始化
    if (this.isSingleFile()) {
      console.info(kleur.dim('Skipping Vite initialization for single file compilation'));
      return false;
    }

    const workspaceDir = this.helper.getWorkspaceDir();
    const targetDir = this.helper.getOuputPath();
    const pkgPath = path.join(targetDir, 'package.json');

    // 如果 package.json 已存在，说明环境初始化过了
    if (fs.existsSync(pkgPath)) {
      return false;
    }

    this.spinner.start('Bootstrapping Vite React environment...');
    await fs.promises.mkdir(workspaceDir, { recursive: true });

    try {
      this.resolveViteCreateApp();
    } catch (err) {
      this.spinner.stop();

      console.error(
        kleur.red('✖'),
        'Failed to bootstrap Vite environment. Please check npm/network\n',
        err,
      );

      return false;
    }

    // 深度合并 package.json
    const rootPkgPath = path.join(this.helper.getProjectRoot(), 'package.json');
    const vitePkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf-8'));

    // 智能剔除原项目中的 Vue 强绑定包，避免带到 React 环境
    const removeVuePackages = (deps: Record<string, any>) => {
      for (const name in deps) {
        if (name.includes('vue') || name.includes('pinia') || name.includes('vite')) {
          delete deps[name];
        }
      }
    };

    // 继承业务依赖，并注入 React 运行时必需的组件
    const mergeDeps = (o1: Record<string, any>, o2: Record<string, any>, isDev = false) => {
      const deps = {
        ...o1,
        ...o2,
      };

      if (!isDev) {
        const { runtime } = this.pkgs;
        deps[runtime.name] = runtime.version;
      }

      return deps;
    };

    // 读取原 package.json
    let rootPkg: Record<string, any> = {};
    if (fs.existsSync(rootPkgPath)) {
      rootPkg = JSON.parse(await fs.promises.readFile(rootPkgPath, 'utf-8'));
    }

    // 执行合并写入
    const newDeps = mergeDeps(rootPkg.dependencies, vitePkg.dependencies);
    const newDevDeps = mergeDeps(rootPkg.devDependencies, vitePkg.devDependencies, true);

    removeVuePackages(newDeps);
    removeVuePackages(newDevDeps);

    vitePkg.dependencies = newDeps;
    vitePkg.devDependencies = newDevDeps;

    await fs.promises.writeFile(pkgPath, JSON.stringify(vitePkg, null, 2), 'utf-8');

    this.spinner.succeed('Standard Vite React environment initialized');

    return true;
  }

  /**
   * 执行 vite 创建命令
   */
  private resolveViteCreateApp() {
    const { output } = this.options;
    const config = output?.bootstrapVite;
    const template = typeof config === 'object' ? config.template : 'react-ts';
    const outDirName = this.helper.getOutDirName();

    // 执行 vite 创建命令，使用 --template xxx 跳过交互式选择
    const cmd = `npm create vite@latest ${outDirName} -- --template ${template}`;

    execSync(cmd, {
      cwd: this.helper.getWorkspaceDir(),
      stdio: 'ignore', // 隐藏 create-vite 内部的输出日志，保持终端整洁
    });
  }
}
