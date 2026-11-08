import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

class PythonRelayHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Quiet logging in tests

    def do_GET(self):
        if self.path == "/" or self.path == "":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "framework": "python-fastapi"}).encode())
        elif self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "runtime": f"python-{sys.version_info.major}.{sys.version_info.minor}"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/test-echo":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"echoed": True, "raw_length": len(body), "forwarded_host": self.headers.get("X-Forwarded-Host")}).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    server = HTTPServer(("127.0.0.1", port), PythonRelayHandler)
    actual_port = server.server_port
    print(f"Uvicorn running on http://127.0.0.1:{actual_port} (Press CTRL+C to quit)", flush=True)
    server.serve_forever()
