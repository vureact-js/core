import { PluginRegister } from '@src/compiler';
import kleur from 'kleur';

export function executePlugins<T, C>(map: PluginRegister<T> | undefined, result: T, ctx: C) {
  for (const pluginName in map) {
    try {
      map[pluginName]?.(result, ctx as any);
    } catch (error: any) {
      console.error(kleur.red(`${kleur.bold('[Plugin]')} Error: ${pluginName} execution failed.`));
      console.error(kleur.red(error));
    }
  }
}
