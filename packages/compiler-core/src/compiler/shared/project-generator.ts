import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export class ProjectGenerator {
  private templateDir: string;

  constructor(private outputDir: string) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    // 1. 发布模式: lib/index.js -> ../templates
    // 2. 开发模式: src/compiler/ -> ../templates
    const possiblePaths = [
      path.resolve(__dirname, '../templates'),
      path.resolve(__dirname, '../../templates'),
    ];

    const foundPath = possiblePaths.find((p) => fs.pathExistsSync(p));
    if (!foundPath) {
      throw new Error('[vureact] Cannot find templates directory.');
    }

    this.templateDir = foundPath;
  }

  async generate() {
    await fs.ensureDir(this.outputDir);

    // 2. 拷贝整个模板目录 (包含 tsconfig, vite.config 等)
    // filter 可以防止覆盖用户已经在 src 里的产物
    await fs.copy(this.templateDir, this.outputDir, {
      overwrite: false,
      filter: (src) => !src.includes('node_modules'),
    });
  }
}
