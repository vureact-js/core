import {
  generate as babelGenerator,
  GeneratorResult as BabelGeneratorResult,
  GeneratorOptions,
} from '@babel/generator';
import * as t from '@babel/types';
import { ReactIRDescriptor } from '@core/transform';
import { genJsx } from './jsx';
import { genReactComponent } from './script';

export type GeneratorResult = BabelGeneratorResult & { ast: t.Program };

export function generate(ir: ReactIRDescriptor, opts?: GeneratorOptions): GeneratorResult {
  const jsx = genJsx(ir) || t.nullLiteral();
  const ast = genReactComponent(ir.script, jsx as t.Expression);

  const { code, map } = babelGenerator(ast, opts);

  return {
    ast,
    code,
    map,
  };
}
