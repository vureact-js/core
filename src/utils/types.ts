export const isString = (v: unknown): v is string => typeof v === 'string';

export const isUndefined = (v: unknown): v is undefined =>
  typeof v === 'undefined';

export const isNull = (v: unknown): v is null =>
  Object.prototype.toString.call(v) === '[object Null]';

export const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
