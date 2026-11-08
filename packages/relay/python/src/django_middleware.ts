export class DjangoHtmlInjector {
  public static injectAgentScript(
    htmlBody: string,
    gatewayUrl = "http://localhost:7331/relay/agent.js",
  ): string {
    const scriptTag = `<script src="${gatewayUrl}" async data-relay-injected="true"></script>`;

    if (htmlBody.includes("</body>")) {
      return htmlBody.replace("</body>", `${scriptTag}\n</body>`);
    }

    if (htmlBody.includes("</html>")) {
      return htmlBody.replace("</html>", `${scriptTag}\n</html>`);
    }

    return `${htmlBody}\n${scriptTag}`;
  }

  public static shouldInject(contentType?: string, statusCode = 200): boolean {
    if (statusCode >= 300 && statusCode < 400) return false; // redirect
    if (!contentType) return false;
    return contentType.toLowerCase().includes("text/html");
  }
}
