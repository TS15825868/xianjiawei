#!/usr/bin/env python3
import json, os, subprocess, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
STATUS=ROOT/'.wan-second-status.json'

def set_status(state, **extra):
    data={'state':state,'updated_at':time.time(),**extra}
    STATUS.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')

def generate():
    set_status('running')
    try:
        p=subprocess.run(['python','tools/wan_second_video.py'],cwd=ROOT,text=True,capture_output=True,timeout=2400)
        outputs=sorted(str(x.relative_to(ROOT)) for x in (ROOT/'public/videos').glob('second-wan-*.mp4'))
        if p.returncode==0 and outputs:
            set_status('done',outputs=outputs,stdout=p.stdout[-12000:])
        else:
            set_status('failed',code=p.returncode,stdout=p.stdout[-12000:],stderr=p.stderr[-12000:])
    except Exception as e:
        set_status('failed',error=repr(e))

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/status':
            body=STATUS.read_bytes() if STATUS.exists() else b'{"state":"starting"}'
            self.send_response(200); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()

set_status('starting')
threading.Thread(target=generate,daemon=True).start()
port=int(os.environ.get('PORT','10000'))
ThreadingHTTPServer(('0.0.0.0',port),Handler).serve_forever()
