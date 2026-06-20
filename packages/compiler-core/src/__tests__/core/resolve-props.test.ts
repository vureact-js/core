import * as attrMod from '@core/transform/sfc/template/syntax-processor/process/props/resolve-attribute-prop';
import * as dirMod from '@core/transform/sfc/template/syntax-processor/process/props/resolve-directive-prop';
import { resolveProps } from '@core/transform/sfc/template/syntax-processor/process/props/resolve-props';
import { NodeTypes } from '@vue/compiler-core';

describe('resolveProps', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('calls resolveAttributeProp for attributes and resolveDirectiveProp for directives', () => {
    const resolveAttrSpy = jest.spyOn(attrMod, 'resolveAttributeProp').mockImplementation(() => {});
    const resolveDirSpy = jest
      .spyOn(dirMod, 'resolveDirectiveProp')
      .mockImplementation(() => false);

    const vueNode: any = { props: [{ type: NodeTypes.ATTRIBUTE }, { type: NodeTypes.DIRECTIVE }] };
    const ir: any = {};
    const ctx: any = {};
    const nodeIR: any = {};
    const siblingNodesIR: any[] = [];

    resolveProps(vueNode, ir, ctx, nodeIR, siblingNodesIR);

    expect(resolveAttrSpy).toHaveBeenCalledTimes(1);
    expect(resolveDirSpy).toHaveBeenCalledTimes(1);
  });

  test('stops processing when resolveDirectiveProp returns true', () => {
    const resolveAttrSpy = jest.spyOn(attrMod, 'resolveAttributeProp').mockImplementation(() => {});
    const resolveDirSpy = jest.spyOn(dirMod, 'resolveDirectiveProp').mockImplementation(() => true);

    const vueNode: any = { props: [{ type: NodeTypes.DIRECTIVE }, { type: NodeTypes.DIRECTIVE }] };
    const ir: any = {};
    const ctx: any = {};
    const nodeIR: any = {};
    const siblingNodesIR: any[] = [];

    resolveProps(vueNode, ir, ctx, nodeIR, siblingNodesIR);

    expect(resolveDirSpy).toHaveBeenCalledTimes(1);
    expect(resolveAttrSpy).not.toHaveBeenCalled();
  });
});
