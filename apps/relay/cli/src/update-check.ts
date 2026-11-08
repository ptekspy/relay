export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateCommand?: string;
}

export async function checkForCliUpdate(
  currentVersion: string,
  packageName = "@paddy-systems/relay",
  timeoutMs = 1500,
): Promise<UpdateCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://registry.npmjs.org/${packageName}/latest`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    );

    if (!res.ok) {
      return { hasUpdate: false, currentVersion };
    }

    const data = (await res.json()) as { version?: string };
    const latestVersion = data.version;

    if (!latestVersion) {
      return { hasUpdate: false, currentVersion };
    }

    const hasUpdate = isNewerVersion(currentVersion, latestVersion);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      updateCommand: `bun update -g ${packageName}`,
    };
  } catch {
    // Non-blocking fail-open
    return { hasUpdate: false, currentVersion };
  } finally {
    clearTimeout(timeout);
  }
}

export function isNewerVersion(current: string, latest: string): boolean {
  const c = current.replace(/^v/, "").split(".").map(Number);
  const l = latest.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const currPart = c[i] ?? 0;
    const latestPart = l[i] ?? 0;
    if (latestPart > currPart) return true;
    if (latestPart < currPart) return false;
  }

  return false;
}
