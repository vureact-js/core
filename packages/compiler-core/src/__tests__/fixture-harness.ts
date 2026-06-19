import { logger } from '@shared/logger';
import { CompilationResult, VuReact } from '@src/compiler';
import fs from 'node:fs';
import path from 'node:path';

// 环境变量：设置为 '1' 时可更新预期输出文件
const UPDATE_EXPECTED = process.env.UPDATE_COMPILER_CORE_FIXTURES === '1';

export interface CompilerFixtureCase {
  name: string; // 测试用例名称，格式为 "suite/相对路径"
  directory: string; // 测试用例所在目录
  suite: 'parse' | 'transform' | 'codegen'; // 所属测试套件类型
  inputFile: string; // 输入文件名
}

interface OutputFile {
  name: string; // 输出文件名
  code: string; // 输出文件内容
}

// 可识别的输入文件名列表
const INPUT_FILES: string[] = [
  'input.vue',
  'input.ts',
  'input.js',
  'input.css',
  'input.less',
  'input.scss',
  'input.sass',
];

// 期望的输出文件名
const OUTPUT_FILE = 'output';

/**
 * 递归扫描根目录下的所有子目录，查找包含 INPUT_FILES 中任何文件的目录，
 * 并将其注册为编译器 fixture 测试用例。
 */
export function findCompilerFixtureCases(
  rootDirectory: string,
  suite: CompilerFixtureCase['suite'],
): CompilerFixtureCase[] {
  const cases: CompilerFixtureCase[] = [];

  /**
   * 递归遍历目录，查找包含输入文件的 fixture 测试用例目录
   */
  const visit = (directory: string) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    // 检查当前目录是否存在任何可识别的输入文件
    const inputFile = INPUT_FILES.find((file) => entries.some((entry) => entry.name === file));

    if (inputFile) {
      // 计算相对于根目录的路径，使用正斜杠作为分隔符
      const relativeName = path.relative(rootDirectory, directory).split(path.sep).join('/');

      cases.push({
        name: `${suite}/${relativeName}`, // 测试用例名称格式：suite/相对路径
        directory,
        suite,
        inputFile,
      });
    }

    // 递归遍历子目录（跳过 expected 目录，避免将预期输出目录误认为测试用例）
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'expected') {
        visit(path.join(directory, entry.name));
      }
    }
  };

  visit(rootDirectory);

  // 按名称排序，确保测试用例执行顺序稳定
  return cases.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 运行单个编译器 fixture 测试用例：
 * 1. 读取输入文件源码
 * 2. 用 FileCompiler 编译
 * 3. 如果 UPDATE_EXPECTED 为 true，则更新 expected 目录
 * 4. 对比实际输出与 expected 目录中的预期文件
 */
export function runCompilerFixture(testCase: CompilerFixtureCase) {
  // 清空日志，避免之前测试用例的日志干扰
  logger.clear();

  // 读取输入文件的源码
  const inputPath = path.join(testCase.directory, testCase.inputFile);
  const source = fs.readFileSync(inputPath, 'utf-8');

  // 创建编译器实例，禁用缓存和日志，关闭 Vite 引导
  const compiler = new VuReact({
    cache: false,
    logging: {
      enabled: false,
    },
    output: {
      bootstrapVite: false,
    },
  });

  // 编译 Vue 侧源码，使用虚拟路径供编译器内部模块解析
  const result = compiler.compile(source, createVirtualFilename(testCase));

  // 解析编译结果，提取输出文件列表
  const outputs = resolveOutputs(result);

  // 收集本次编译产生的日志输出
  const logOutput = resolveLogOutput();

  // 如果有日志输出，将其添加到输出文件列表中
  if (logOutput) {
    outputs.push(logOutput);
  }

  const expectedDirectory = path.join(testCase.directory, 'expected');
  if (UPDATE_EXPECTED) {
    // 更新模式：直接将当前输出覆盖 expected 目录
    writeOutputs(expectedDirectory, outputs);
  }

  // jest 断言：每个输出文件都必须与 expected 目录中的预期文件完全一致
  for (const output of outputs) {
    const expectedPath = path.join(expectedDirectory, output.name);
    expect(fs.existsSync(expectedPath)).toBe(true);

    // 编译输出的代码与 expected/output.[?] 的文件内容进行对比
    const expected = fs.readFileSync(expectedPath, 'utf-8');
    expect(normalizeNewlines(output.code)).toBe(normalizeNewlines(expected));
  }

  logger.clear();
}

/**
 * 为输入文件构造虚拟路径，用于编译器内部的模块解析，
 * 路径格式为 "__fixtures__/{suite}/{相对路径}/{inputFile}"。
 */
function createVirtualFilename(testCase: CompilerFixtureCase): string {
  const relativeDirectory = testCase.name.split('/').slice(1);
  return path.posix.join('__fixtures__', testCase.suite, ...relativeDirectory, testCase.inputFile);
}

/**
 * 根据编译结果的结构解析输出文件列表。
 * 支持 JSX/TSX 文件（含关联 CSS）、Script 文件、纯 CSS 文件三种输出形态。
 */
function resolveOutputs(result: CompilationResult): OutputFile[] {
  const outputs: OutputFile[] = [];
  const { code, fileInfo } = result;

  // 情况 1：JSX 输出（可能附带 CSS）
  if ('jsx' in fileInfo) {
    const { jsx, css } = fileInfo;

    outputs.push({
      name: `${OUTPUT_FILE}.${jsx.lang}x`,
      code,
    });

    if (css.code) {
      outputs.push({
        name: `${OUTPUT_FILE}.css`,
        code: css.code,
      });
    }

    return outputs;
  }

  // 情况 2：Script 输出（TS/JS）
  if ('script' in fileInfo) {
    outputs.push({
      name: `${OUTPUT_FILE}.${fileInfo.script.lang}`,
      code,
    });
    return outputs;
  }

  // 情况 3：纯 CSS 输出
  outputs.push({
    name: `${OUTPUT_FILE}.css`,
    code,
  });

  return outputs;
}

/**
 * 将输出文件写入指定目录（如 expected）。
 */
function writeOutputs(directory: string, outputs: OutputFile[]) {
  fs.mkdirSync(directory, { recursive: true });

  for (const output of outputs) {
    fs.writeFileSync(path.join(directory, output.name), normalizeNewlines(output.code), 'utf-8');
  }
}

/**
 * 将换行符统一为 \n，消除平台差异（Windows CRLF → LF）。
 */
function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, '\n');
}

/**
 * 从 logger 中提取日志，若有日志则构建 logs.json 输出文件。
 */
function resolveLogOutput(): OutputFile | undefined {
  const logs = logger.getLogs();

  if (!logs.length) {
    return undefined;
  }

  return {
    name: 'logs.json',
    code: `${JSON.stringify(logs.map(stripAnsiFromLog), null, 2)}\n`,
  };
}

/**
 * 去除日志对象中的 ANSI 转义码（用于终端着色），
 * 使日志内容在纯文本文件中可读。
 */
function stripAnsiFromLog<T extends Record<string, any> & { message: string }>(log: T): T {
  const result: Record<string, any> = { ...log };

  if (typeof result.message === 'string') {
    result.message = stripAnsi(result.message);
  }

  // 统一 source 字段的换行符，避免 Windows (CRLF) 与 Linux (LF) 差异导致测试失败
  if (typeof result.source === 'string') {
    result.source = normalizeNewlines(result.source);
  }

  return result as T;
}

/**
 * 去除字符串中的 ANSI 转义序列。
 */
function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}
