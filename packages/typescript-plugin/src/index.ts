import * as ts from 'typescript/lib/tsserverlibrary';
import { EstrelaPlugin } from './plugin';

export = (module: { typescript: typeof ts }) =>
  new EstrelaPlugin(module.typescript);
