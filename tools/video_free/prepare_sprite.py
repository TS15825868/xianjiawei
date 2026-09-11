#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reconstruct the locked mascot master from part files and normalize pose cells.

This does not redraw or invent a mascot. It only removes transparent padding inside the
already-approved sprite cells so close-up gesture poses render at a consistent visual scale.
The resulting base64 WEBP overwrites mascot-sprite-v20260816.txt only inside CI runtime.
"""
from __future__ import annotations
import base64
import io
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
REF=ROOT/'assets/reference'
OUT=REF/'mascot-sprite-v20260816.txt'
PARTS=[REF/f'mascot-sprite-v20260816.part{i}' for i in range(5)]
BOXES={
    'main':(8,35,8+188,35+390),
    'wave':(235,25,235+150,25+145),
    'tray':(405,25,405+175,25+150),
    'thumb':(245,215,245+150,215+133),
    'deer':(430,235,430+71,235+80),
    'turtle':(530,235,530+80,235+77),
}

def fit(cell:Image.Image,w:int,h:int,pad:int=3)->Image.Image:
    alpha=cell.getchannel('A')
    bbox=alpha.getbbox()
    if not bbox:
        return cell
    obj=cell.crop(bbox)
    obj.thumbnail((max(1,w-2*pad),max(1,h-2*pad)),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(w,h),(0,0,0,0))
    x=(w-obj.width)//2
    y=h-obj.height-pad
    out.alpha_composite(obj,(x,max(pad,y)))
    return out

def main():
    text=''.join(p.read_text(encoding='utf-8').strip() for p in PARTS)
    raw=base64.b64decode(text)
    if not (raw[:4]==b'RIFF' and raw[8:12]==b'WEBP'):
        raise SystemExit(f'not approved WEBP master: {raw[:16]!r}')
    sheet=Image.open(io.BytesIO(raw)).convert('RGBA')
    # Main full-body pose already defines scale; keep it untouched. Normalize the smaller
    # gesture/partner cells only, using the same approved pixels.
    for name,box in BOXES.items():
        if name=='main':
            continue
        x0,y0,x1,y1=box
        cell=sheet.crop(box)
        sheet.paste((0,0,0,0),box)
        sheet.alpha_composite(fit(cell,x1-x0,y1-y0),(x0,y0))
    buf=io.BytesIO()
    sheet.save(buf,'WEBP',lossless=True,quality=100,method=6)
    OUT.write_text(base64.b64encode(buf.getvalue()).decode('ascii'),encoding='utf-8')
    # final verification
    chk=base64.b64decode(OUT.read_text(encoding='utf-8'))
    im=Image.open(io.BytesIO(chk)); im.verify()
    print('PASS reconstructed + normalized approved mascot sprite',sheet.size)

if __name__=='__main__':
    main()
