// transformation-logger.ts
import type { NodePath } from '@babel/traverse';
import type { SourceLocation } from '@babel/types';
import * as t from '@babel/types';
import { isNull } from '@utils/types';
import type { Node } from '@vue/compiler-core';
import { cyan, cyanBright, dim, red, white, whiteBright, yellow, type Color } from 'colorette';
import { capitalize } from '.';

export interface LogMessage {
  level: 'error' | 'warn' | 'info';
  message: string;
  location?: SourceLocation;
}

export class TransformationLogger {
  readonly name = 'Eddie';
  private sourceCode = '';
  private filename = '';
  private stack: (() => void)[] = [];

  addContext(filename: string, code: string) {
    this.filename = filename;
    this.sourceCode = code;
  }

  printAll() {
    if (!this.stack.length) return;
    this.stack.forEach((fn) => fn());
  }

  // Vue's Node Type also contains the same Babel loc object

  error(target: NodePath | t.Node | Node, message: string) {
    this.stack.push(() => this.log('error', target as NodePath, message));
  }

  warn(target: NodePath | t.Node | Node, message: string) {
    this.stack.push(() => this.log('warn', target as NodePath, message));
  }

  info(message: string) {
    this.stack.push(() =>
      this.printError({
        level: 'info',
        message,
      }),
    );
  }

  debug(message: string) {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    console.debug(`[DEBUG ${hours}:${minutes}:${seconds}] ${cyan(this.filename)} | ${message}`);
  }

  log(level: 'error' | 'warn', target: NodePath | t.Node, message: string) {
    const location = this.getLocationFromTarget(target);
    this.printError({
      level,
      message,
      location,
    });
  }

  private getLocationFromTarget(target: NodePath | t.Node): SourceLocation | undefined {
    if ('node' in target) {
      // NodePath 类型
      return target.node.loc || undefined;
    } else {
      // t.Node 类型
      return target.loc || undefined;
    }
  }

  private printError(message: LogMessage) {
    const output = this.formatError(message);
    if (message.level === 'error') {
      console.error(output);
    } else if (message.level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  private formatError(message: LogMessage): string {
    const lines: string[] = [];

    lines.push('');

    // 第一行：错误级别和消息
    const levelColor = this.getLevelColor(message.level);
    lines.push(
      levelColor(`🤖 [${capitalize(this.name)} ${message.level.toUpperCase()}] ${message.message}`),
    );

    // 文件位置行
    if (message?.location) {
      const { filename, start } = message.location;

      lines.push(
        cyanBright(
          `  ${dim('❯')} ${filename || this.filename}:${dim(`${start.line}:${start.column}`)}`,
        ),
      );
    }

    // 源代码上下文
    if (this.sourceCode && message?.location?.start) {
      const context = this.getCodeContext(message.location);

      if (context.context.length) {
        context.context.forEach(({ lineNumber, content, isTarget }) => {
          const lineNumStr = lineNumber.toString().padStart(6);
          lines.push(` ${dim(`${lineNumStr} |`)} ${content}`);

          // 在目标行下面添加指针
          if (isTarget) {
            lines.push(`${whiteBright('|'.padStart(9))} ${levelColor(context.pointer)}`);
          }
        });
      }
    }

    return lines.join('\n');
  }

  /**
   * 获取源代码上下文和指针位置
   */
  private getCodeContext(
    location: SourceLocation,
    contextLines: number = 2,
  ): {
    context: Array<{
      lineNumber: number;
      content: string;
      isTarget: boolean;
    }>;
    pointer: string;
  } {
    if (!this.sourceCode || !location.start) {
      return { context: [], pointer: '' };
    }

    const lines = this.sourceCode.split('\n');
    const targetLine = location.start.line - 1;
    const targetColumn = location.start.column;

    const startLine = Math.max(0, targetLine - contextLines);
    const endLine = Math.min(lines.length - 1, targetLine + contextLines);

    const context = [];
    for (let i = startLine; i <= endLine; i++) {
      context.push({
        lineNumber: i + 1,
        content: lines[i] || '',
        isTarget: i === targetLine,
      });
    }

    // 生成指针，指向具体位置
    const pointerLength = location.end
      ? Math.max(1, location.end.column - location.start.column)
      : 1;

    const pointer = ' '.repeat(targetColumn) + '^'.repeat(pointerLength);

    return { context, pointer };
  }

  private getLevelColor(level: string): Color {
    const colors = {
      error: red,
      warn: yellow,
      info: white,
    };
    return colors[level as keyof typeof colors];
  }
}

function createLogger() {
  let instance: TransformationLogger | null = null;
  return () => {
    if (isNull(instance)) {
      instance = new TransformationLogger();
    }
    return instance;
  };
}

const loggerFn = createLogger();

export const logger = loggerFn();
