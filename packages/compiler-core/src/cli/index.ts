import { cac } from 'cac';
import { bin, version } from '../../package.json';
import { resolveAction } from './action';
import { resolveOptions } from './option';

// The program name is 'vureact'
const [programName] = Object.keys(bin);
const cli = cac(programName);
const command = cli.command('[root]', 'Compile Vue3 to React');

resolveOptions(command).action(resolveAction);

cli.help().version(version).parse();
