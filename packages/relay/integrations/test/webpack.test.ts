import { describe, expect, it } from "bun:test";
import { RelayWebpackPlugin, relayWebpack } from "../src/webpack.js";

describe("TASK-126: Webpack 5 DevServer Middleware Hook", () => {
  it("initializes plugin and applies compiler hooks", () => {
    const plugin = relayWebpack({ relayHost: "http://192.168.1.10:7331" });

    let hookTapped = false;
    plugin.apply({
      hooks: {
        done: {
          tap: (name, cb) => {
            expect(name).toBe("RelayWebpackPlugin");
            hookTapped = true;
            cb();
          },
        },
      },
    });

    expect(hookTapped).toBe(true);
  });

  it("patches devServer config with allowedHosts: 'all' to prevent host check rejection", () => {
    const plugin = new RelayWebpackPlugin();
    const config = plugin.patchDevServerConfig({
      allowedHosts: ["localhost"],
      client: {
        webSocketURL: {
          pathname: "/ws",
        },
      },
    });

    expect(config.allowedHosts).toBe("all");
    expect(config.client?.webSocketURL?.pathname).toBe("/ws");
  });

  it("injects agent script tag into Webpack HTML template", () => {
    const plugin = new RelayWebpackPlugin({
      relayHost: "http://10.0.0.2:7331",
    });
    const template =
      "<!DOCTYPE html><html><head><title>App</title></head><body></body></html>";

    const injected = plugin.injectAgentHtml(template);
    expect(injected).toContain(
      '<script type="module" src="http://10.0.0.2:7331/agent.js"></script>',
    );
    expect(injected).toContain("</head>");
  });
});
