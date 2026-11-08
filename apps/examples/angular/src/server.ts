import { createServer } from "node:http";
import { AngularRelayAdapter } from "@paddy-systems/relay-integrations";

export function buildAngularServer() {
  const adapter = new AngularRelayAdapter();

  const server = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Angular 19 Relay Example</title>
</head>
<body>
  <app-root ng-version="19.0.0" ng-server-context="ssr">
    <h1>Angular 19 Zoneless Application</h1>
    <p>Rendered with @angular/build Vite devServer</p>
  </app-root>
</body>
</html>`;
      const htmlWithAgent = adapter.injectAgentScript(rawHtml);
      res.end(htmlWithAgent);
      return;
    }

    if (req.url === "/api/test-echo" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: true, framework: "angular-19" }));
      return;
    }

    if (req.url === "/ng-cli-ws" && req.headers.upgrade === "websocket") {
      // Angular CLI Vite dev server HMR endpoint
      res.writeHead(101, {
        Upgrade: "websocket",
        Connection: "Upgrade",
      });
      res.end();
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  return server;
}
