import * as ts from 'typescript/lib/tsserverlibrary';

export class EstrelaLanguageService implements Partial<ts.LanguageService> {
  constructor(private readonly tsLang: ts.LanguageService) {}

  findReferences = this.bindStateBehavior('findReferences');
  getDefinitionAndBoundSpan = this.bindStateBehavior(
    'getDefinitionAndBoundSpan'
  );
  getReferencesAtPosition = this.bindStateBehavior('getReferencesAtPosition');
  getImplementationAtPosition = this.bindStateBehavior(
    'getImplementationAtPosition'
  );
  getTypeDefinitionAtPosition = this.bindStateBehavior(
    'getTypeDefinitionAtPosition'
  );

  getCompletionsAtPosition = (
    filename: string,
    position: number,
    options: any
  ) => {
    const prior = this.tsLang.getCompletionsAtPosition(
      filename,
      position,
      options
    );
    if (prior) {
      const states = this.getStatesAtPosition(filename, position);
      prior.entries = prior.entries.flatMap(item => {
        const state = states.find(s => s.text === item.name);
        if (state) {
          const name = state.text + '$';
          if (!prior.entries.find(e => e.name === name)) {
            return [item, { ...item, name }];
          }
        }
        return item;
      });
    }
    return prior;
  };

  getCompletionEntryDetails = (
    filename: string,
    position: number,
    name: string,
    options: any,
    source: any,
    preferences: any,
    data: any
  ) => {
    let prior = this.tsLang.getCompletionEntryDetails(
      filename,
      position,
      name,
      options,
      source,
      preferences,
      data
    );
    if (!prior && /[^_$]\$$/.test(name)) {
      const states = this.getStatesAtPosition(filename, position);
      const stateName = name.replace(/\$$/, '');
      if (states.find(s => s.text === stateName)) {
        prior = this.tsLang.getCompletionEntryDetails(
          filename,
          position,
          stateName,
          options,
          source,
          preferences,
          data
        );
        if (prior) {
          prior = {
            ...prior,
            displayParts: this.addStateToDisplayParts(prior.displayParts ?? []),
            kind: ts.ScriptElementKind.constElement,
            name,
          };
        }
      }
    }
    return prior;
  };

  getQuickInfoAtPosition = (filename: string, position: number) => {
    let prior = this.tsLang.getQuickInfoAtPosition(filename, position);
    const definition = this.tsLang.getDefinitionAtPosition(filename, position);
    const state = this.getStateAtPosition(filename, position);
    if (!definition?.[0] && state) {
      prior = this.tsLang.getQuickInfoAtPosition(
        filename,
        state.spans[0].start
      );
      const span = this.tsLang.getNameOrDottedNameSpan(
        filename,
        position,
        position
      );
      if (prior && span) {
        prior.displayParts = this.addStateToDisplayParts(
          prior.displayParts ?? []
        );
        prior.textSpan = span;
      }
    }
    return prior;
  };

  getSemanticDiagnostics = (filename: string) => {
    return this.tsLang.getSemanticDiagnostics(filename).filter(diagnostic => {
      const isError = diagnostic.category === ts.DiagnosticCategory.Error;
      if (diagnostic.start && isError && diagnostic.code === 2552) {
        const state = this.getStateAtPosition(filename, diagnostic.start);
        if (state) {
          return false;
        }
      }
      return true;
    });
  };

  private bindStateBehavior<T extends keyof ts.LanguageService>(
    method: T
  ): ts.LanguageService[T] {
    return ((filename: string, position: number) => {
      let prior = (this.tsLang as any)[method](filename, position);
      if (!prior) {
        const state = this.getStateAtPosition(filename, position);
        if (state) {
          return (this.tsLang as any)[method](filename, state.spans[0].start);
        }
      }
      return prior;
    }) as any;
  }

  private getStateAtPosition(
    filename: string,
    position: number
  ): ts.NavigationTree | undefined {
    const span = this.tsLang.getNameOrDottedNameSpan(
      filename,
      position,
      position
    );
    if (span) {
      const source: ts.SourceFile = (this.tsLang as any).getNonBoundSourceFile(
        filename
      );
      const name = source.text.slice(span.start, span.start + span.length);
      if (/[^_$]\$$/.test(name)) {
        const stateName = name.replace(/\$$/, '');
        const states = this.getStatesAtPosition(filename, span.start);
        return states.find(s => s.text === stateName);
      }
    }
    return undefined;
  }

  private getStatesAtPosition(
    filename: string,
    position: number
  ): ts.NavigationTree[] {
    const tree = this.tsLang.getNavigationTree(filename);
    const scope = tree.childItems?.find(
      item =>
        /^[A-Z]/.test(item.text) &&
        /^(var|let|const|function)$/.test(item.kind) &&
        item.spans[0].start < position &&
        item.spans[0].start + item.spans[0].length > position
    );
    return scope?.childItems?.filter(item => item.kind === 'let') ?? [];
  }

  private addStateToDisplayParts(
    displayParts: ts.SymbolDisplayPart[]
  ): ts.SymbolDisplayPart[] {
    const kind: ts.SymbolDisplayPart = {
      kind: 'keyword',
      text: 'const',
    };
    const state: ts.SymbolDisplayPart = {
      kind: 'localName',
      text: 'State',
    };
    const lt: ts.SymbolDisplayPart = {
      kind: 'punctuation',
      text: '<',
    };
    const gt: ts.SymbolDisplayPart = {
      kind: 'punctuation',
      text: '>',
    };
    const findColonIndex = displayParts.findIndex(part => part.text === ':');
    return displayParts.reduce((acc, part, index) => {
      if (index === 0) {
        acc.push(kind);
      } else if (index === findColonIndex + 2) {
        acc.push(state);
        acc.push(lt);
        acc.push(part);
      } else {
        acc.push(part);
      }
      if (index === displayParts.length - 1) {
        acc.push(gt);
      }
      return acc;
    }, [] as ts.SymbolDisplayPart[]);
  }
}
