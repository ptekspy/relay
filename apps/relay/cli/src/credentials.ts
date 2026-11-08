import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export interface StoredCredentials {
  apiKey?: string;
  sessionToken?: string;
  teamId?: string;
  updatedAt: string;
}

export class CredentialStorage {
  private readonly configDir: string;
  private readonly credentialsFile: string;

  constructor(customDir?: string) {
    this.configDir = customDir ?? resolve(homedir(), ".config", "relay");
    this.credentialsFile = resolve(this.configDir, "credentials.json");
  }

  public save(creds: Partial<StoredCredentials>): void {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
    }

    const current = this.load();
    const updated: StoredCredentials = {
      ...current,
      ...creds,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(this.credentialsFile, JSON.stringify(updated, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });

    try {
      chmodSync(this.credentialsFile, 0o600);
    } catch {
      // Best-effort permission tightening on Windows
    }
  }

  public load(): StoredCredentials {
    if (!existsSync(this.credentialsFile)) {
      return { updatedAt: new Date().toISOString() };
    }

    try {
      const content = readFileSync(this.credentialsFile, "utf8");
      return JSON.parse(content) as StoredCredentials;
    } catch {
      return { updatedAt: new Date().toISOString() };
    }
  }

  public clear(): void {
    if (existsSync(this.credentialsFile)) {
      writeFileSync(this.credentialsFile, "{}", { mode: 0o600 });
    }
  }
}
