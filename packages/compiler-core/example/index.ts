import path from 'path';
import { VuReactCompiler } from '../src';

const compiler = new VuReactCompiler({
  root: path.join(process.cwd(), 'example'),
  input: 'src',
});

compiler.run();
