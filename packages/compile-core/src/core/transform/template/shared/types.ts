import { Expression } from '@babel/types';

export const enum NodeTypes {
  FRAGMENT = 0,
  ELEMENT = 1,
  TEXT = 2,
  COMMENT = 3,
  JSX_INTERPOLATION = 4,
}

export interface BabelExp<T = Expression> {
  content: string;
  ast: T;
}
