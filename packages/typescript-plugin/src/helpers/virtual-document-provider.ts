import { VirtualDocumentProvider } from 'typescript-styled-plugin/lib/api';
import { TemplateContext } from 'typescript-template-language-service-decorator';
import { Position, TextDocument } from 'vscode-languageserver-textdocument';

/**
 * Standard virtual document provider for styled content.
 *
 * Wraps content in a top level `:root { }` rule to make css language service happy
 * since styled allows properties to be top level elements.
 */
export class StyledVirtualDocumentFactory implements VirtualDocumentProvider {
  private static readonly wrapperPreRoot = ':root{\n';
  private static readonly wrapperPreKeyframes = '@keyframes custom {\n';

  public createVirtualDocument(context: TemplateContext): TextDocument {
    const contents = `${this.getVirtualDocumentWrapper(context)}${
      context.text
    }\n}`;
    return {
      uri: 'untitled://embedded.scss',
      languageId: 'scss',
      version: 1,
      getText: () => contents,
      positionAt: (offset: number) => {
        const pos = context.toPosition(
          this.fromVirtualDocOffset(offset, context)
        );
        return this.toVirtualDocPosition(pos);
      },
      offsetAt: (p: Position) => {
        const offset = context.toOffset(this.fromVirtualDocPosition(p));
        return this.toVirtualDocOffset(offset, context);
      },
      lineCount: contents.split(/\n/g).length + 1,
    };
  }

  public toVirtualDocPosition(
    position: ts.LineAndCharacter
  ): ts.LineAndCharacter {
    return {
      line: position.line + 1,
      character: position.character,
    };
  }

  public fromVirtualDocPosition(
    position: ts.LineAndCharacter
  ): ts.LineAndCharacter {
    return {
      line: position.line - 1,
      character: position.character,
    };
  }

  public toVirtualDocOffset(offset: number, context: TemplateContext): number {
    return offset + this.getVirtualDocumentWrapper(context).length;
  }

  public fromVirtualDocOffset(
    offset: number,
    context: TemplateContext
  ): number {
    return offset - this.getVirtualDocumentWrapper(context).length;
  }

  public getVirtualDocumentWrapper(context: TemplateContext): string {
    const tag = (context.node.parent as ts.Node & { tag: any })?.tag
      ?.escapedText;
    return tag === 'keyframes'
      ? StyledVirtualDocumentFactory.wrapperPreKeyframes
      : StyledVirtualDocumentFactory.wrapperPreRoot;
  }
}
