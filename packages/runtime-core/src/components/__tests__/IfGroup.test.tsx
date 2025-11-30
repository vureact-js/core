import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import IfGroup, { Else, ElseIf, If } from '../IfGroup';

describe('IfGroup - 渲染逻辑测试', () => {
  describe('基础渲染路径', () => {
    it('应渲染第一个 If 当条件为 true', () => {
      render(
        <IfGroup conditions={[true, false, false]}>
          <If>
            <div data-testid="if-content">If Content</div>
          </If>
          <ElseIf>
            <div data-testid="elseif-content">ElseIf Content</div>
          </ElseIf>
          <Else>
            <div data-testid="else-content">Else Content</div>
          </Else>
        </IfGroup>,
      );

      expect(screen.getByTestId('if-content')).toBeInTheDocument();
      expect(screen.queryByTestId('elseif-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('else-content')).not.toBeInTheDocument();
    });

    it('应渲染第一个满足条件的 ElseIf', () => {
      render(
        <IfGroup conditions={[false, true, false, true]}>
          <If>
            <div data-testid="if-content">If Content</div>
          </If>
          <ElseIf>
            <div data-testid="elseif1-content">ElseIf 1</div>
          </ElseIf>
          <ElseIf>
            <div data-testid="elseif2-content">ElseIf 2</div>
          </ElseIf>
          <ElseIf>
            <div data-testid="elseif3-content">ElseIf 3</div>
          </ElseIf>
        </IfGroup>,
      );

      expect(screen.queryByTestId('if-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('elseif1-content')).toBeInTheDocument();
      expect(screen.queryByTestId('elseif2-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('elseif3-content')).not.toBeInTheDocument();
    });

    it('应渲染 Else 当所有条件为 false', () => {
      render(
        <IfGroup conditions={[false, false, false]}>
          <If>
            <div data-testid="if-content">If Content</div>
          </If>
          <ElseIf>
            <div data-testid="elseif-content">ElseIf Content</div>
          </ElseIf>
          <Else>
            <div data-testid="else-content">Else Content</div>
          </Else>
        </IfGroup>,
      );

      expect(screen.queryByTestId('if-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('elseif-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('else-content')).toBeInTheDocument();
    });

    it('应返回 null 当所有条件为 false 且无 Else', () => {
      const { container } = render(
        <IfGroup conditions={[false, false]}>
          <If>
            <div data-testid="if-content">If Content</div>
          </If>
          <ElseIf>
            <div data-testid="elseif-content">ElseIf Content</div>
          </ElseIf>
        </IfGroup>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('边界场景', () => {
    it('应处理只有 If 和 Else 的情况', () => {
      render(
        <IfGroup conditions={[false]}>
          <If>
            <div data-testid="if-content">If Content</div>
          </If>
          <Else>
            <div data-testid="else-content">Else Content</div>
          </Else>
        </IfGroup>,
      );

      expect(screen.getByTestId('else-content')).toBeInTheDocument();
    });

    it('应处理多个 ElseIf 连续为 false 的情况', () => {
      render(
        <IfGroup conditions={[false, false, true, false]}>
          <If>
            <div>1</div>
          </If>
          <ElseIf>
            <div>2</div>
          </ElseIf>
          <ElseIf>
            <div data-testid="target">3</div>
          </ElseIf>
          <ElseIf>
            <div>4</div>
          </ElseIf>
        </IfGroup>,
      );

      expect(screen.getByTestId('target')).toBeInTheDocument();
    });

    it('应只评估到第一个满足条件的分支', () => {
      const conditions = [false, true, true];
      const { rerender } = render(
        <IfGroup conditions={conditions}>
          <If>
            <div>1</div>
          </If>
          <ElseIf>
            <div data-testid="target">2</div>
          </ElseIf>
          <ElseIf>
            <div>3</div>
          </ElseIf>
        </IfGroup>,
      );

      expect(screen.getByTestId('target')).toBeInTheDocument();

      // 确认即使后续条件变化，也不会重新渲染
      conditions[2] = false;
      rerender(
        <IfGroup conditions={conditions}>
          <If>
            <div>1</div>
          </If>
          <ElseIf>
            <div data-testid="target">2</div>
          </ElseIf>
          <ElseIf>
            <div>3</div>
          </ElseIf>
        </IfGroup>,
      );

      // 组件未重新渲染，因为第一个 ElseIf 已满足
      expect(screen.getByTestId('target')).toBeInTheDocument();
    });

    it('应处理空的 conditions 数组', () => {
      const { container } = render(
        <IfGroup conditions={[]}>
          <If>
            <div>1</div>
          </If>
        </IfGroup>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('错误处理', () => {
    it('应抛出错误当第一个子元素不是 If', () => {
      expect(() => {
        render(
          <IfGroup conditions={[true]}>
            <ElseIf>
              <div>1</div>
            </ElseIf>
          </IfGroup>,
        );
      }).toThrow('missing the required <If>');
    });

    it('应抛出错误当子元素包含非法类型', () => {
      expect(() => {
        render(
          <IfGroup conditions={[true]}>
            <If>
              <div>1</div>
            </If>
            <div>非法子元素</div> {/* 不是 If/ElseIf/Else */}
          </IfGroup>,
        );
      }).toThrow('can only contain <If>, <ElseIf>, and <Else>');
    });

    it('应抛出错误当 Else 出现在 ElseIf 之前', () => {
      expect(() => {
        render(
          <IfGroup conditions={[false, true]}>
            <If>
              <div>1</div>
            </If>
            <Else>
              <div>2</div>
            </Else>
            <ElseIf>
              <div>3</div>
            </ElseIf>
          </IfGroup>,
        );
      }).toThrow('[IfGroup] unexpected component <Else>');
    });

    it('应抛出错误当包含多个 Else', () => {
      expect(() => {
        render(
          <IfGroup conditions={[false, false, false]}>
            <If>
              <div>1</div>
            </If>
            <ElseIf>
              <div>2</div>
            </ElseIf>
            <Else>
              <div>3</div>
            </Else>
            <Else>
              <div>4</div>
            </Else>{' '}
            {/* 多余的 Else */}
          </IfGroup>,
        );
      }).toThrow();
    });

    it('应抛出错误当存在任何非限定的子组件', () => {
      expect(() => {
        render(
          <IfGroup conditions={[false, false, false]}>
            {/* 不允许注释 */}
            <If>
              <div>1</div>
            </If>
            Not allowed
            <Else>
              <div>3</div>
            </Else>
            <div></div>
          </IfGroup>,
        );
      }).toThrow();
    });
  });

  describe('复杂嵌套场景', () => {
    it('应支持嵌套的 IfGroup', () => {
      render(
        <IfGroup conditions={[true]}>
          <If>
            <div data-testid="outer-if">
              <IfGroup conditions={[false, true]}>
                <If>
                  <span>Inner 1</span>
                </If>
                <ElseIf>
                  <span data-testid="inner-elseif">Inner 2</span>
                </ElseIf>
              </IfGroup>
            </div>
          </If>
        </IfGroup>,
      );

      expect(screen.getByTestId('outer-if')).toBeInTheDocument();
      expect(screen.getByTestId('inner-elseif')).toBeInTheDocument();
    });

    it('应处理 Fragment 和文本节点', () => {
      render(
        <IfGroup conditions={[true]}>
          <If>
            <>Fragment Text</>
          </If>
        </IfGroup>,
      );

      expect(screen.getByText('Fragment Text')).toBeInTheDocument();
    });
  });

  describe('渲染行为', () => {
    it('应在 conditions 内容变化时重新评估', () => {
      const ChildComponent = jest.fn(() => <div>Child</div>);
      let conditions = [false];

      const { rerender } = render(
        <IfGroup conditions={conditions}>
          <If>
            <ChildComponent />
          </If>
        </IfGroup>,
      );

      expect(ChildComponent).not.toHaveBeenCalled();

      // 创建新数组（内容变化）
      conditions = [true];
      rerender(
        <IfGroup conditions={conditions}>
          <If>
            <ChildComponent />
          </If>
        </IfGroup>,
      );

      expect(ChildComponent).toHaveBeenCalledTimes(1);
    });
  });
});
