import { traverse } from '@babel/core';
import { ScriptBlockIR } from '..';
import { optimizationFunction } from './function';

export function necessaryOptimization(ast: ScriptBlockIR) {
  traverse(ast, {
    Function(path) {
      optimizationFunction(path);
    },
  });
}
