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
    print('WAN_STATUS',json.dumps(data,ensure_ascii=False),flush=True)

def generate():
    set_status('running')
    try:
        p=subprocess.Popen(['python','tools/wan_second_video_regular.py'],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,bufsize=1)
        tail=[]; deadline=time.time()+2400
        for line in p.stdout:
            line=line.rstrip(); tail.append(line); tail=tail[-180:]
            print('WAN>',line,flush=True)
            if time.time()>deadline:
                p.kill(); raise TimeoutError('Wan generation exceeded 40 minutes')
        code=p.wait(); outputs=sorted(str(x.relative_to(ROOT)) for x in (ROOT/'public/videos').glob('second-wan-*.mp4'))
        if code==0 and outputs: set_status('done',outputs=outputs,tail=tail)
        else: set_status('failed',code=code,outputs=outputs,tail=tail)
    except Exception as e: set_status('failed',error=repr(e))

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/status':
            body=STATUS.read_bytes() if STATUS.exists() else b'{"state":"starting"}'
            self.send_response(200); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()

set_status('starting'); threading.Thread(target=generate,daemon=True).start()
port=int(os.environ.get('PORT','10000')); ThreadingHTTPServer(('0.0.0.0',port),Handler).serve_forever()
