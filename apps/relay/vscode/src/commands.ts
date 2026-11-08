export type CommandHandler = (...args: unknown[]) => Promise<unknown> | unknown;

export class RelayCommandRegistry {
  private commands = new Map<string, CommandHandler>();

  public registerCommand(
    commandId: string,
    handler: CommandHandler,
  ): () => void {
    this.commands.set(commandId, handler);
    return () => this.commands.delete(commandId);
  }

  public async executeCommand(
    commandId: string,
    ...args: unknown[]
  ): Promise<unknown> {
    const handler = this.commands.get(commandId);
    if (!handler) {
      throw new Error(`Command ${commandId} not found`);
    }
    return await handler(...args);
  }

  public getRegisteredCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}
