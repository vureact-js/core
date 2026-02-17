import { ICompilationContext } from '@compiler/context/types';
import { camelCase } from '@utils/camelCase';
import { capitalize } from '@utils/capitalize';
import { genHashByXXH } from '@utils/hash';
import { basename } from 'path';

export function buildComponentName(ctx: ICompilationContext): string {
  const { filename, funcName } = ctx as ICompilationContext & { funcName?: string };

  const name = !funcName
    ? basename(filename).split('.')[0] || `C${genHashByXXH(filename)}`
    : funcName;

  return capitalize(camelCase(name));
}
