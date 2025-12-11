import { parseFragmentExp } from '@shared/babel-utils';
import { ElementNodeIR } from '../../elements/node';
import { BaseSimpleNodeIR } from '../create-simple-node';

export function preParseComment(nodeIR: BaseSimpleNodeIR) {
  nodeIR.babelExp = parseFragmentExp(nodeIR.content, true);
}

export function preParseInterp(nodeIR: BaseSimpleNodeIR, content: string) {
  nodeIR.babelExp = parseFragmentExp(content);
}

export function preParseCondition(nodeIR: ElementNodeIR, key: string, value: string) {
  nodeIR.meta.condition = {
    [key]: true,
    value,
    babelExp: parseFragmentExp(value),
  };
}

export function preParseMemo(nodeIR: ElementNodeIR, value: string) {
  nodeIR.meta.memo = {
    isMemo: true,
    value,
    babelExp: parseFragmentExp(value),
  };
}
