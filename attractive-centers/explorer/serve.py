"""Local-only preview; Python standard library. Ctrl+C stops the server."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import webbrowser

if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    server = ThreadingHTTPServer(('127.0.0.1', 8791), partial(SimpleHTTPRequestHandler, directory=str(root)))
    print('Explorer: http://127.0.0.1:8791/   (Ctrl+C to stop)', flush=True)
    webbrowser.open('http://127.0.0.1:8791/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
