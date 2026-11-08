import type { RelayExtensionConfig } from "./types.js";

export const DEFAULT_CONFIG: RelayExtensionConfig = {
  defaultPort: 3000,
  autoLaunchOnPortDetect: true,
  showStatusBarPill: true,
  redactAuthHeaders: true,
};

export class RelayConfigurationProvider {
  private config: RelayExtensionConfig = { ...DEFAULT_CONFIG };

  public get<K extends keyof RelayExtensionConfig>(
    key: K,
  ): RelayExtensionConfig[K] {
    return this.config[key];
  }

  public update(newConfig: Partial<RelayExtensionConfig>): void {
    Object.assign(this.config, newConfig);
  }

  public getAll(): RelayExtensionConfig {
    return { ...this.config };
  }
}
