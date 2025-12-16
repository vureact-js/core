import * as t from '@babel/types';
import { RV3_HOOKS } from '@consts/runtimeModules';
import { CallExpArgs } from '../types';

export function build$useState(_arguments: CallExpArgs) {
  return t.callExpression(t.identifier(RV3_HOOKS.$useState), _arguments);
}
