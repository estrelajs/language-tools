import * as ts from 'typescript/lib/tsserverlibrary';
import { EstrelaLanguageService } from './language-service';
import { LanguageServiceLogger } from './logger';

export class EstrelaPlugin {
  private logger?: LanguageServiceLogger;

  public constructor(private readonly typescript: typeof ts) {}

  public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    this.logger = new LanguageServiceLogger(info);

    this.logger.log('Attaching to typescript');

    if (!isValidTypeScriptVersion(this.typescript)) {
      this.logger.log(
        'Invalid typescript version detected. TypeScript 3.x required.'
      );
      return info.languageService;
    }

    return {
      ...info.languageService,
      ...new EstrelaLanguageService(info.languageService),
    };
  }

  public onConfigurationChanged(config: any) {
    if (this.logger) {
      this.logger.log('onConfigurationChanged');
    }
  }
}

function isValidTypeScriptVersion(typescript: typeof ts): boolean {
  const [major] = typescript.version.split('.');
  return +major >= 3;
}
