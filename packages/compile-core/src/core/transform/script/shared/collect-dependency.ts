import { compileContext } from '@shared/compile-context';

export function collectDependency(name: string) {
  const { dependencies } = compileContext.context;
  dependencies.add(name);
}
