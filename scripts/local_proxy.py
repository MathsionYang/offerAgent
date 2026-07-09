import argparse
import json
import re
import threading
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WEB_ROOT = ROOT / "apps" / "web2"


def read_key_file(path):
    raw = Path(path).read_text(encoding="utf-8")
    key_match = re.search(r"KEY\s*:\s*(\S+)", raw)
    url_match = re.search(r"URL\s*:\s*(\S+)", raw)
    if not key_match or not url_match:
        raise RuntimeError("Key file must contain KEY: and URL:")
    return key_match.group(1).strip(), url_match.group(1).strip().rstrip("/")


class LocalProxyHandler(BaseHTTPRequestHandler):
    upstream_base_url = ""

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path != "/chat/completions":
            self.send_json({"error": "Only /chat/completions is supported"}, 404)
            return

        content_length = int(self.headers.get("content-length", "0"))
        body = self.rfile.read(content_length)
        authorization = self.headers.get("authorization")
        if not authorization:
            self.send_json({"error": "Missing Authorization header"}, 401)
            return

        request = urllib.request.Request(
            f"{self.upstream_base_url}/chat/completions",
            data=body,
            headers={
                "Authorization": authorization,
                "Content-Type": self.headers.get("content-type", "application/json; charset=utf-8"),
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                self.send_response(response.status)
                self.send_cors_headers()
                self.send_header("Content-Type", response.headers.get("content-type", "application/json"))
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()

                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    self.wfile.flush()
        except urllib.error.HTTPError as error:
            payload = error.read()
            self.send_response(error.code)
            self.send_cors_headers()
            self.send_header("Content-Type", error.headers.get("content-type", "application/json"))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as error:
            self.send_json({"error": str(error)}, 502)

    def send_json(self, payload, status):
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "authorization, content-type")
        self.send_header("Access-Control-Max-Age", "86400")

    def log_message(self, format, *args):
        print(f"[proxy] {self.address_string()} - {format % args}")


class StaticHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path in ("", "/"):
            path = "/index.html"
        file_path = (WEB_ROOT / path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(WEB_ROOT.resolve())) or not file_path.is_file():
            self.send_response(404)
            self.end_headers()
            return

        content_type = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
        }.get(file_path.suffix, "application/octet-stream")

        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        print(f"[web] {self.address_string()} - {format % args}")


def serve(server):
    with server:
        server.serve_forever()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--key-file", default=str(ROOT / "1.md"))
    parser.add_argument("--web-port", type=int, default=5173)
    parser.add_argument("--proxy-port", type=int, default=8787)
    args = parser.parse_args()

    _, upstream_base_url = read_key_file(args.key_file)
    LocalProxyHandler.upstream_base_url = upstream_base_url

    web_server = ThreadingHTTPServer(("127.0.0.1", args.web_port), StaticHandler)
    proxy_server = ThreadingHTTPServer(("127.0.0.1", args.proxy_port), LocalProxyHandler)

    threading.Thread(target=serve, args=(web_server,), daemon=True).start()
    threading.Thread(target=serve, args=(proxy_server,), daemon=True).start()

    print("本地真实模型环境已启动")
    print(f"页面地址: http://127.0.0.1:{args.web_port}/")
    print(f"代理 Base URL: http://127.0.0.1:{args.proxy_port}")
    print("页面中选择 OpenAI-Compatible 代理 / 自定义接口")
    print("模型名称填写 qwen-plus，API Key 仍填写你的真实 Key")
    print("按 Ctrl+C 停止")

    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        web_server.shutdown()
        proxy_server.shutdown()


if __name__ == "__main__":
    main()
