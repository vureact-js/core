import type { EDDIE_REACT_DEPS, REACT } from '@constants/react';

export interface TransformedImportInfo {
  [REACT]: Set<string>;
  [EDDIE_REACT_DEPS]: Set<string>;
}
