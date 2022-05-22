import * as ts from 'typescript/lib/tsserverlibrary';
import { findAllNodes, findNode } from '../utils/nodes';

export class ScriptSourceHelper {
  constructor(
    private readonly typescript: typeof ts,
    private readonly project: ts.server.Project
  ) {}

  public getNode(fileName: string, position: number) {
    const sourceFile = this.getSourceFile(fileName);
    return sourceFile && findNode(this.typescript, sourceFile, position);
  }

  public getAllNodes(
    fileName: string,
    cond: (n: ts.Node) => boolean
  ): ReadonlyArray<ts.Node> {
    const sourceFile = this.getSourceFile(fileName);
    return sourceFile ? findAllNodes(this.typescript, sourceFile, cond) : [];
  }

  public getLineAndChar(
    fileName: string,
    position: number
  ): ts.LineAndCharacter {
    const scriptInto = this.project.getScriptInfo(fileName);
    if (!scriptInto) {
      return { line: 0, character: 0 };
    }
    const location = scriptInto.positionToLineOffset(position);
    return { line: location.line - 1, character: location.offset - 1 };
  }

  public getOffset(fileName: string, line: number, character: number) {
    const scriptInto = this.project.getScriptInfo(fileName);
    if (!scriptInto) {
      return 0;
    }
    return scriptInto.lineOffsetToPosition(line + 1, character + 1);
  }

  private getProgram() {
    return this.project.getLanguageService().getProgram();
  }

  private getSourceFile(fileName: string) {
    const program = this.getProgram();
    return program ? program.getSourceFile(fileName) : undefined;
  }
}
