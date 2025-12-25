import { ParseResult } from '@babel/parser';
import { handleVueApiCallExp } from './call-expression';
import { necessaryOptimization } from './optimizations';
import { handleReactiveUpdate } from './reactive-update';
import { stripReactiveValueSuffix } from './strip-value-suffix';
import { handleVueApiVariableDecl } from './variable-declarator';

export type ScriptBlockIR = ParseResult;

export function transformScript(ast?: ParseResult): ScriptBlockIR | null {
  if (!ast) return null;

  // step 1
  stripReactiveValueSuffix(ast);

  // step 2
  handleVueApiVariableDecl(ast);
  necessaryOptimization(ast);
  handleVueApiCallExp(ast);

  // step 3
  handleReactiveUpdate(ast);

  return ast;
}
 