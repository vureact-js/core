import * as t from '@babel/types';

type CallableParam = t.Identifier | t.RestElement;

export function cloneCallableParams(
  params: Array<CallableParam | t.PatternLike>,
): Array<CallableParam> {
  const cloneCallableParam = (
    param: CallableParam | t.PatternLike,
    index: number,
  ): CallableParam => {
    if (t.isRestElement(param)) {
      const arg = param.argument;
      const name = t.isIdentifier(arg) ? arg.name : `args${index}`;
      const rest = t.restElement(t.identifier(name));

      rest.typeAnnotation =
        param.typeAnnotation ||
        (t.isIdentifier(arg) ? arg.typeAnnotation : null) ||
        t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword()));

      return rest;
    }

    if (t.isIdentifier(param)) {
      const id = t.identifier(param.name || `arg${index}`);

      id.optional = param.optional;
      id.typeAnnotation = param.typeAnnotation || t.tsTypeAnnotation(t.tsAnyKeyword());

      return id;
    }

    const fallback = t.identifier(`arg${index}`);
    fallback.typeAnnotation = t.tsTypeAnnotation(t.tsAnyKeyword());

    return fallback;
  };

  return params.map(cloneCallableParam);
}
