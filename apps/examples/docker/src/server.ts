import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 4000);

export function startDockerService(port = PORT) {
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({ status: "healthy", container: "relay-service-1" }),
      );
      return;
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<!doctype html>
<html>
  <head><title>Docker Container Service</title></head>
  <body>
    <h1>Relay Docker Container Service</h1>
    <p>Running inside Docker container port ${port}</p>
  </body>
</html>`);
  });

  return new Promise<{ port: number; close: () => Promise<void> }>(
    (resolve) => {
      server.listen(port, "0.0.0.0", () => {
        resolve({
          port,
          close: () => new Promise<void>((r) => server.close(() => r())),
        });
      });
    },
  );
}

if (import.meta.main) {
  startDockerService().then(() => {
    console.log(`Docker service running on port ${PORT}`);
  });
}
