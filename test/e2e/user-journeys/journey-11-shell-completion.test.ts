import { describe, expect, it } from "bun:test";
import {
  generateShellCompletion,
  type SupportedShell,
} from "../../../apps/relay/cli/src/completion.js";

describe("Journey 11: Shell Tab-Completion Generation (Bash / Zsh / Fish)", () => {
  it("generates valid completion scripts for bash, zsh, and fish with all flags", () => {
    // 1. Bash completion verification
    const bashScript = generateShellCompletion("bash");
    expect(bashScript).toContain("_relay_completions()");
    expect(bashScript).toContain("complete -F _relay_completions relay");
    expect(bashScript).toContain("--gateway-port");
    expect(bashScript).toContain("--no-browser");
    expect(bashScript).toContain("--large-qr");
    expect(bashScript).toContain("--host");

    // 2. Zsh completion verification
    const zshScript = generateShellCompletion("zsh");
    expect(zshScript).toContain("#compdef relay");
    expect(zshScript).toContain("_relay()");
    expect(zshScript).toContain(
      "--large-qr[Display high-visibility large QR code",
    );
    expect(zshScript).toContain("--gateway-port[Port for Relay LAN gateway");

    // 3. Fish completion verification
    const fishScript = generateShellCompletion("fish");
    expect(fishScript).toContain("complete -c relay -f");
    expect(fishScript).toContain("complete -c relay -l gateway-port");
    expect(fishScript).toContain("complete -c relay -l no-browser");
    expect(fishScript).toContain("complete -c relay -l large-qr");

    // 4. Unsupported shell error verification
    expect(() =>
      generateShellCompletion("powershell" as SupportedShell),
    ).toThrow("Unsupported shell: powershell");
  });
});
