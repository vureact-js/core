import { ParseResult } from '@babel/parser';
import { transformComputed } from './computed';
import { transformFunction } from './function';
import { transformLifeCycle } from './lifecycle';
import { transformReactive } from './reactive';

export type ScriptBlockIR = ParseResult;

export function transformScript(ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  const scriptIR = ast;

  transformReactive(scriptIR);
  transformComputed(scriptIR);
  transformLifeCycle(scriptIR);
  transformFunction(scriptIR);

  return scriptIR;
}
