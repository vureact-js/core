import { ReactIRDescriptor } from '@core/transform';
import { generateJsx } from './jsx';

// todo
export function generate(ir: ReactIRDescriptor) {
  generateJsx(ir);
}
