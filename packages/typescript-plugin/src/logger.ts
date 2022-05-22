export class Logger {
  constructor(private readonly info: ts.server.PluginCreateInfo) {}

  public log(msg: string) {
    this.info.project.projectService.logger.info(`[ts-estrela-plugin] ${msg}`);
  }
}
