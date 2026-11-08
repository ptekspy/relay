export interface FlaskRelayConfig {
  gatewayUrl: string;
  autoInject: boolean;
  captureLogs: boolean;
}

export class FlaskRelayExtension {
  private config: FlaskRelayConfig;
  private isInitialized = false;

  constructor(config?: Partial<FlaskRelayConfig>) {
    this.config = {
      gatewayUrl: "http://localhost:7331",
      autoInject: true,
      captureLogs: true,
      ...config,
    };
  }

  public initApp(appInfo: { name: string; debug: boolean }): boolean {
    this.isInitialized = true;
    return true;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getConfig(): FlaskRelayConfig {
    return { ...this.config };
  }
}
