import path from 'path';
import { VuReact } from '../src/compiler';

const compiler = new VuReact({
  root: path.join(process.cwd(), 'example'),
  input: 'src',
});

compiler.run();
