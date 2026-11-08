export interface RelayVitePluginOptions {
  enabled?: boolean;
}

export function relayPlugin(options: RelayVitePluginOptions = {}) {
  const enabled = options.enabled ?? true;

  return {
    name: "vite-plugin-relay-agent",
    apply: "serve" as const,
    transformIndexHtml(html: string) {
      if (!enabled) return html;

      // Inject the relay agent bootstrap script at the top of the body
      const scriptTag = `<script type="module">
        import { initRelayAgent } from '@paddy-systems/relay-agent';
        initRelayAgent();
      </script>`;

      if (html.includes("</body>")) {
        return html.replace("</body>", `${scriptTag}\n</body>`);
      }
      return `${html}\n${scriptTag}`;
    },
  };
}
