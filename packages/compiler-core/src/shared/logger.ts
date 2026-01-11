/* eslint-disable no-console */
import kleur from 'kleur';
import { relative } from 'path';

interface LogOptions {
  file?: string;
  source?: string;
  loc?: {
    start?: {
      line?: number;
      column?: number;
    };
  };
  // 自定义上下文行数
  contextLines?: number;
}

interface LogEntry {
  level: 'warn' | 'error' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  source?: string;
}

export class Logger {
  private logs: LogEntry[] = [];
  private contextLines: number = 2; // 默认上下各2行
  private tabWidth: number = 2; // 制表符转换宽度

  warn(message: any, opts: LogOptions = {}): void {
    this.addLog('warn', kleur.yellow(message), opts);
  }

  error(message: any, opts: LogOptions = {}): void {
    this.addLog('error', kleur.red(message), opts);
  }

  info(message: any, opts: LogOptions = {}): void {
    this.addLog('info', kleur.cyan(message), opts);
  }

  private addLog(level: 'warn' | 'error' | 'info', message: any, opts: LogOptions): void {
    const { file, source, loc } = opts;

    // 提取位置信息
    const logLine = loc?.start?.line;
    const logColumn = loc?.start?.column;

    this.logs.push({
      level,
      message,
      file: file ? relative(process.cwd(), file) : undefined,
      line: logLine,
      column: logColumn,
      source,
    });
  }

  private levelColor(level: string): kleur.Color {
    return level === 'error' ? kleur.red : level === 'warn' ? kleur.yellow : kleur.cyan;
  }

  private formatHeader(log: LogEntry): string {
    const label = log.level.toUpperCase();
    const level = this.levelColor(log.level)(`[${label}]`);

    let location = '\n\n  File: ';

    if (log.level !== 'info') {
      if (log?.line != null && log?.column != null) {
        location += `${log.file}${`:${log.line}:${log.column}`}`;
      } else {
        location += log.file ?? 'anonymous:';
      }

      return `${level} ${log.message}${kleur.gray(location)}\n`;
    }

    return `${level} ${log.message}\n`;
  }

  private formatContext(log: LogEntry): string {
    const { source, level, line, column } = log;

    if (!source || line == null || column == null) {
      return '';
    }

    const color = this.levelColor(level);
    const lines = source.split('\n');
    const lineIndex = line - 1; // 转换为 0-based 索引

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return '';
    }

    // 计算显示行范围
    const startLine = Math.max(0, lineIndex - this.contextLines);
    const endLine = Math.min(lines.length - 1, lineIndex + this.contextLines);

    const result: string[] = [];
    const lineNumWidth = (endLine + 1).toString().length;

    for (let i = startLine; i <= endLine; i++) {
      let lineContent = lines[i] || '';

      // 将制表符转换为空格以保持视觉对齐
      lineContent = lineContent.replace(/\t/g, ' '.repeat(this.tabWidth));

      const lineNum = i + 1;
      result.push(`  > ${lineNum.toString().padStart(lineNumWidth)} | ${lineContent}`);

      // 在错误行下方添加指针标记
      if (i === lineIndex) {
        const prefixLength = 4 + lineNumWidth + 4; // "  > " + 行号 + " | "

        // 防止列号越界，确保指针不会超出该行长度
        const maxColumn = Math.max(0, lineContent.length);
        const pointerColumn = Math.min(column - 1, maxColumn);

        const pointerIndent = ' '.repeat(prefixLength + pointerColumn);
        result.push(color(`${pointerIndent}${`^`}`));
      }
    }

    return result.join('\n');
  }

  printAll(opts?: { errors?: boolean; warnings?: boolean; info?: boolean }): void {
    const { logs } = this;

    if (logs.length === 0) {
      console.log('No logs to display.');
      return;
    }

    const errorLogs = opts?.errors === false ? [] : logs.filter((l) => l.level === 'error');

    const warnLogs = opts?.warnings === false ? [] : logs.filter((l) => l.level === 'warn');

    const infoLogs = opts?.info === false ? [] : logs.filter((l) => l.level === 'info');

    // 按 error > warn > info 顺序输出
    const orderedLogs = [...errorLogs, ...warnLogs, ...infoLogs];

    for (const log of orderedLogs) {
      console.log();
      console.log(this.formatHeader(log));
      const context = this.formatContext(log);
      if (context) {
        console.log(context);
      }

      console.log(); // 空行分隔
    }

    // 输出统计摘要
    const errorCount = logs.filter((log) => log.level === 'error').length;
    const warnCount = logs.filter((log) => log.level === 'warn').length;
    const infoCount = logs.filter((log) => log.level === 'info').length;

    if (errorCount > 0 || warnCount > 0) {
      console.log(
        `${kleur.red(`❌ ${errorCount} error(s)`)}, ⚠️  ${kleur.yellow(`${warnCount} warning(s)`)}, ℹ️  ${kleur.blue(`${infoCount} info message(s)`)}`,
      );
    } else {
      console.log(kleur.cyan(`ℹ️  ${infoCount} info message(s)`));
    }

    console.log();
  }

  clear(): void {
    this.logs = [];
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  hasErrors(): boolean {
    return this.logs.some((log) => log.level === 'error');
  }

  hasWarnings(): boolean {
    return this.logs.some((log) => log.level === 'warn');
  }
}

// 默认实例
export const logger = new Logger();
