#!/usr/bin/env python3
"""Local dev server that mimics Firebase Hosting's cleanUrls: /scholars -> scholars.html.

Usage: python3 serve.py [port]   (default 8080)
"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def translate_path(self, path):
        full = super().translate_path(path)
        if not os.path.exists(full) and os.path.isfile(full + ".html"):
            return full + ".html"
        return full

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"Serving {ROOT} at http://localhost:{port} (clean URLs on)")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
