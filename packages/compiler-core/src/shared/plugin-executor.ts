import { ICompilationContext } from '@compiler/context/types';
import { PluginRegister } from '@src/compiler';
import kleur from 'kleur';

export function executePlugins<T>(
  map: PluginRegister<T> | undefined,
  result: T,
  ctx: ICompilationContext,
) {
  for (const pluginName in map) {
    try {
      map[pluginName]?.(result, ctx);
    } catch (error: any) {
      console.error(kleur.red(`${kleur.bold('[Plugin]')} Error: ${pluginName} execution failed.`));
      console.error(kleur.red(error));
    }
  }
}
