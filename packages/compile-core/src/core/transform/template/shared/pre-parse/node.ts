import { parseFragmentExp } from '@shared/babel-utils';
import { strCodeTypes } from '@shared/string-code-types';
import { BaseSimpleNodeIR } from '../create-simple-node';

export function preParseComment(nodeIR: BaseSimpleNodeIR) {
  nodeIR.babelExp = parseFragmentExp(nodeIR.content, true);
}

export function preParseInterp(nodeIR: BaseSimpleNodeIR, content: string) {
  nodeIR.babelExp = parseFragmentExp(content, strCodeTypes.isStringLiteral(content));
}
