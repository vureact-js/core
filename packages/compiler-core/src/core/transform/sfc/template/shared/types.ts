import { Expression } from '@babel/types';

export const enum NodeTypes {
  FRAGMENT = 0,
  ELEMENT = 1,
  TEXT = 2,
  COMMENT = 3,
  JSX_INTERPOLATION = 4,
}

export const enum PropTypes {
  ATTRIBUTE = 1,
  SLOT = 2,
  EVENT = 3,
  DYNAMIC_ATTRIBUTE = 4,
}

export interface BabelExp<T = Expression> {
  content: string;
  ast: T;
}