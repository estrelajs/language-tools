import { ExtensionContext } from 'vscode';
import { TsPlugin } from './tsplugin';

export function activate(context: ExtensionContext) {
  const tsPlugin = new TsPlugin(context);
  tsPlugin.askToEnable();
}
