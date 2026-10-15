#!/usr/bin/env python3
"""Frame product photographs without modifying their pixels or proportions.

Run after adding a product page. Existing hero, card and variant stages are
handled by site.css; supplemental photographs get a full-resolution link.
"""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PRODUCT_PATH = re.compile(r'(?:^|/)images/(?:partner-products|product-main|dm-final)/')
STAGES = {'product-card__img', 'product-detail-hero__media',
          'product-variant__photo', 'home-product-showcase__grid',
          'modal-gallery__item', 'trial-product-card__media',
          'product-photo-frame', 'modal-detail-media__frame'}
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'base', 'embed', 'param', 'track', 'col'}

class Photos(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source, self.stack, self.edits = source, [], []
        self.offsets = [0]
        for line in source.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'img' and PRODUCT_PATH.search(attrs.get('src', '')):
            ancestors = {c for _, classes in self.stack for c in classes}
            if not ancestors.intersection(STAGES):
                line, column = self.getpos()
                start = self.offsets[line-1] + column
                original = self.get_starttag_text()
                # Preserve any existing image link rather than nesting anchors.
                linked = any(t == 'a' for t, _ in self.stack)
                frame = '<span class="product-photo-frame">' + original + '</span>'
                if not linked:
                    from html import escape
                    frame = '<a class="product-photo-original" href="' + escape(attrs['src'], quote=True) + '" target="_blank" rel="noopener">' + frame + '</a>'
                self.edits.append((start, start + len(original), frame))
        if tag not in VOID:
            self.stack.append((tag, attrs.get('class', '').split()))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID: self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

def frame(source):
    parser = Photos(source)
    parser.feed(source)
    for start, end, value in reversed(parser.edits):
        source = source[:start] + value + source[end:]
    return source, len(parser.edits)

if __name__ == '__main__':
    count = 0
    for path in sorted(ROOT.glob('*.html')):
        old = path.read_text(encoding='utf-8')
        new, added = frame(old)
        if new != old: path.write_text(new, encoding='utf-8')
        count += added
    print(f'Framed {count} supplemental product photos; source files untouched.')
