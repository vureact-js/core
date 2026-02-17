/* eslint-disable no-console */
import kleur from 'kleur';
import { normalizePath, relativePath } from './path';

type LogLevel = 'warning' | 'error' | 'info';

interface LogOptions {
  file?: string;
  source?: string;
  loc?: {
    start?: {
      line?: number;
      column?: number;
    };
  } | null;
  contextLines?: number;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  source?: string;
  contextLines?: number;
}

interface PrintOptions {
  errors?: boolean;
  warnings?: boolean;
  info?: boolean;
}

export class Logger {
  private logs: LogEntry[] = [];
  private contextLines = 2;
  private tabWidth = 2;

  warn(message: any, opts: LogOptions = {}): void {
    this.addLog('warning', kleur.yellow(message), opts);
  }

  error(message: any, opts: LogOptions = {}): void {
    this.addLog('error', kleur.red(message), opts);
  }

  info(message: any, opts: LogOptions = {}): void {
    this.addLog('info', kleur.cyan(message), opts);
  }

  private addLog(level: LogLevel, message: any, opts: LogOptions): void {
    this.logs.push(this.createLogEntry(level, message, opts));
  }

  // Normalize call-site payload into a stable internal log entry.
  private createLogEntry(level: LogLevel, message: any, opts: LogOptions): LogEntry {
    const { file, source, loc, contextLines } = opts;

    return {
      level,
      message,
      file: file ? normalizePath(relativePath(file)) : undefined,
      line: loc?.start?.line,
      column: loc?.start?.column,
      source,
      contextLines,
    };
  }

  private levelColor(level: LogLevel | string): kleur.Color {
    return level === 'error'
      ? kleur.red
      : level === 'warning' || level === 'warn'
        ? kleur.yellow
        : kleur.cyan;
  }

  // Render the header line and optional location block.
  private formatHeader(log: LogEntry): string {
    const label = log.level.toUpperCase();
    const level = this.levelColor(log.level)(`${kleur.bold('[vureact]')} ${label}:`);

    if (log.level === 'info') {
      return `${level} ${log.message}\n`;
    }

    const location = this.formatLocation(log);
    return `${level} ${log.message}${location}\n`;
  }

  // Render location only when file and/or loc metadata is available.
  private formatLocation(log: LogEntry): string {
    const locationText = this.resolveLocation(log);

    if (!locationText) {
      return '';
    }

    return kleur.gray(`\n\n  at ${locationText}`);
  }

  // Build location text with partial metadata support.
  private resolveLocation(log: LogEntry): string {
    const { file, line, column } = log;

    if (file && line != null && column != null) {
      return `${file}:${line}:${column}`;
    }

    if (file && line != null) {
      return `${file}:${line}`;
    }

    if (file) {
      return file;
    }

    if (line != null && column != null) {
      return `${line}:${column}`;
    }

    if (line != null) {
      return `${line}`;
    }

    return '';
  }

  // Render source context around the error location when available.
  private formatContext(log: LogEntry): string {
    const { source, level, line, column } = log;

    if (!source || line == null || column == null) {
      return '';
    }

    const color = this.levelColor(level);
    const lines = source.split('\n');
    const lineIndex = line - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      return '';
    }

    const contextLines = log.contextLines ?? this.contextLines;
    const startLine = Math.max(0, lineIndex - contextLines);
    const endLine = Math.min(lines.length - 1, lineIndex + contextLines);

    const result: string[] = [];
    const lineNumWidth = (endLine + 1).toString().length;

    for (let i = startLine; i <= endLine; i++) {
      let lineContent = lines[i] || '';
      lineContent = lineContent.replace(/\t/g, ' '.repeat(this.tabWidth));

      const lineNum = i + 1;
      result.push(`  > ${lineNum.toString().padStart(lineNumWidth)} | ${lineContent}`);

      if (i === lineIndex) {
        const prefixLength = 4 + lineNumWidth + 3;
        const maxColumn = Math.max(0, lineContent.length);
        const pointerColumn = Math.min(column, maxColumn);
        const pointerIndent = ' '.repeat(prefixLength + pointerColumn);

        result.push(color(`${pointerIndent}^`));
      }
    }

    return result.join('\n');
  }

  private getOrderedLogs(opts?: PrintOptions): LogEntry[] {
    const errorLogs = opts?.errors === false ? [] : this.logs.filter((l) => l.level === 'error');
    const warnLogs = opts?.warnings === false ? [] : this.logs.filter((l) => l.level === 'warning');
    const infoLogs = opts?.info === false ? [] : this.logs.filter((l) => l.level === 'info');

    return [...errorLogs, ...warnLogs, ...infoLogs];
  }

  private printSummary(): void {
    const errorCount = this.logs.filter((log) => log.level === 'error').length;
    const warnCount = this.logs.filter((log) => log.level === 'warning').length;
    const infoCount = this.logs.filter((log) => log.level === 'info').length;

    if (errorCount > 0 || warnCount > 0) {
      console.log(
        `${kleur.red(`X ${errorCount} error(s)`)}, ${kleur.yellow(`! ${warnCount} warning(s)`)}, ${kleur.blue(`i ${infoCount} info message(s)`)}`,
      );
      return;
    }

    console.log(kleur.cyan(`i ${infoCount} info message(s)`));
  }

  printAll(opts?: PrintOptions): void {
    if (this.logs.length === 0) {
      console.log('No logs to display.');
      return;
    }

    const orderedLogs = this.getOrderedLogs(opts);

    for (const log of orderedLogs) {
      console.log();
      console.log(this.formatHeader(log));

      const context = this.formatContext(log);
      if (context) {
        console.log(context);
      }

      console.log();
    }

    this.printSummary();
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
    return this.logs.some((log) => log.level === 'warning');
  }
}

export const logger = new Logger();
