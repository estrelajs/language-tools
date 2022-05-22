import {
  getTemplateSettings,
  StyledTemplateLanguageService,
} from 'typescript-styled-plugin/lib/api';
import { decorateWithTemplateLanguageService } from 'typescript-template-language-service-decorator';
import * as ts from 'typescript/lib/tsserverlibrary';
import { ConfigurationManager } from './configuration';
import { ScriptSourceHelper } from './helpers/script-source-helper';
import { StyledVirtualDocumentFactory } from './helpers/virtual-document-provider';
import { Logger } from './logger';
import { EstrelaLanguageService } from './services/estrela-language-service';

export class EstrelaPlugin {
  private logger?: Logger;
  private configManager = new ConfigurationManager();

  public constructor(private readonly typescript: typeof ts) {}

  public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    this.logger = new Logger(info);
    this.configManager.updateFromPluginConfig(info.config);

    this.logger.log('Attaching to typescript');

    if (!isValidTypeScriptVersion(this.typescript)) {
      this.logger.log(
        'Invalid typescript version detected. TypeScript 3.x required.'
      );
      return info.languageService;
    }

    return decorateWithTemplateLanguageService(
      this.typescript,
      this.getTsLanguageService(info),
      info.project,
      new StyledTemplateLanguageService(
        this.typescript,
        this.configManager as any,
        new StyledVirtualDocumentFactory(),
        this.logger
      ),
      getTemplateSettings(this.configManager as any),
      { logger: this.logger }
    );
  }

  public onConfigurationChanged(config: any) {
    if (this.logger) {
      this.logger.log('onConfigurationChanged');
    }
    this.configManager.updateFromPluginConfig(config);
  }

  private getTsLanguageService(info: ts.server.PluginCreateInfo) {
    const estrelaLang = new EstrelaLanguageService(
      info.languageService,
      new ScriptSourceHelper(this.typescript, info.project)
    );

    return new Proxy(info.languageService, {
      get: (target: any, property: string | symbol) => {
        return (filename: string, ...rest: any[]) => {
          const args = [filename, ...rest];
          if (/\.[jt]sx$/.test(filename)) {
            return (
              (estrelaLang as any)[property]?.apply(estrelaLang, args) ??
              target[property].apply(target, args)
            );
          }
          return target[property].apply(target, args);
        };
      },
    });
  }
}

function isValidTypeScriptVersion(typescript: typeof ts): boolean {
  const [major] = typescript.version.split('.');
  return +major >= 3;
}
