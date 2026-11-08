import { createServer } from "node:http";
import { SocketIoRelayAdapter } from "@paddy-systems/relay-integrations";
import { Server as SocketIOServer } from "socket.io";

export function buildSocketIoServer() {
  const adapter = new SocketIoRelayAdapter();

  const httpServer = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "socket-io" }));
      return;
    }

    if (req.url === "/api/test-echo" && req.method === "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: true, service: "socket-io" }));
      return;
    }

    if (!adapter.isSocketIoRequest(req.url || "")) {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  const io = new SocketIOServer(httpServer, adapter.getServerOptions());

  io.on("connection", (socket) => {
    socket.emit("welcome", { message: "Connected to Socket.io via Relay" });

    socket.on("ping:message", (data, callback) => {
      if (typeof callback === "function") {
        callback({ pong: true, received: data });
      }
    });
  });

  return { httpServer, io };
}
