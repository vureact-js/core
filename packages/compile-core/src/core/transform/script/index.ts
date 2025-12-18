import { ParseResult } from '@babel/parser';
import { transformComputed } from './computed';
import { transformFunction } from './function';
import { transformLifeCycle } from './lifecycle';
import { transformReactive } from './reactive';
import { transformReadonly } from './readonly';
import { stripReactiveValueSuffix } from './strip-value-suffix';

export type ScriptBlockIR = ParseResult;

export function transformScript(ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  const scriptIR = ast;

  stripReactiveValueSuffix(scriptIR);

  transformReactive(scriptIR);
  transformComputed(scriptIR);
  transformReadonly(scriptIR);
  transformLifeCycle(scriptIR);
  transformFunction(scriptIR);

  return scriptIR;
}
