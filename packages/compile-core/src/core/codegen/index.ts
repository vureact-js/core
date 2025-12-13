import { ReactIRDescriptor } from '@core/transform';
import { generateJsx } from './jsx';

// todo 配置选项集成：prettier 格式化代码、预设 babel generate 选项
export function generate(ir: ReactIRDescriptor) {
  generateJsx(ir);
}
