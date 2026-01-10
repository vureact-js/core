import {
  generate as babelGenerator,
  GeneratorResult as BabelGeneratorResult,
  GeneratorOptions,
} from '@babel/generator';
import * as t from '@babel/types';
import { ICompilationContext } from '@compiler/context/types';
import { ReactIRDescriptor } from '@core/transform';
import { genJsx } from './jsx';
import { genReactComponent } from './script';

export type GeneratorResult = BabelGeneratorResult & { ast: t.Program };

/**
 * Generates a React component from the provided intermediate representation (IR) descriptor.
 *
 * @param {ReactIRDescriptor} ir - The React IR descriptor that contains the necessary information to generate the component.
 * @param {ICompilationContext} ctx - Compilation context.
 * @param {GeneratorOptions} opts - Optional generator options that can customize the output.
 *
 * @returns {GeneratorResult} An object containing the generated Abstract Syntax Tree (AST), the generated code as a string, and an optional source map for the generated code.
 */
export function generate(
  ir: ReactIRDescriptor,
  ctx: ICompilationContext,
  opts?: GeneratorOptions,
): GeneratorResult {
  const jsx = genJsx(ctx, ir);
  const ast = genReactComponent(ctx, ir.script, jsx);

  const { code, map } = babelGenerator(ast, opts);

  return {
    ast,
    code,
    map,
  };
}
