"""Small source-preserving HTML reader used by SEO build and regression checks."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://cognis.group'
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

class Node:
    def __init__(self, tag='', attrs=(), start=0, inner=0, parent=None):
        self.tag, self.attrs, self.start, self.inner = tag, dict(attrs), start, inner
        self.close = self.end = inner
        self.parent, self.children = parent, []
    def walk(self):
        yield self
        for c in self.children:
            if isinstance(c, Node): yield from c.walk()
    def text(self):
        if self.tag in ('script', 'style', 'template', 'noscript'): return ''
        return re.sub(r'\s+', ' ', ''.join(c.text() if isinstance(c, Node) else c for c in self.children)).strip()

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source, self.lines = source, [0]
        self.lines += [m.end() for m in re.finditer('\n', source)]
        self.root = Node(); self.stack = [self.root]
        self.feed(source)
    def position(self):
        line, col = self.getpos(); return self.lines[line-1] + col
    def handle_starttag(self, tag, attrs):
        start = self.position()
        n = Node(tag, attrs, start, start + len(self.get_starttag_text()), self.stack[-1])
        self.stack[-1].children.append(n)
        if tag not in VOID: self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID: self.stack.pop()
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                n = self.stack[i]; n.close = self.position()
                n.end = self.source.find('>', n.close) + 1
                self.stack = self.stack[:i]; break
    def handle_data(self, data): self.stack[-1].children.append(data)
    def find(self, tag=None, **attrs):
        return [n for n in self.root.walk() if (tag is None or n.tag == tag)
                and all(n.attrs.get(k.rstrip('_').replace('_','-')) == v for k,v in attrs.items())]

def edit(source, edits):
    limit = len(source)
    for start, end, value in sorted(edits, reverse=True):
        if end > limit: raise ValueError('Overlapping source edits')
        source = source[:start] + value + source[end:]; limit = start
    return source

def objects(value):
    if isinstance(value, dict):
        yield value
        for v in value.values(): yield from objects(v)
    elif isinstance(value, list):
        for v in value: yield from objects(v)

def sitemap_paths():
    return [ROOT / (url.removeprefix(ORIGIN).strip('/') + '/index.html').lstrip('/')
            for url in re.findall(r'<loc>(.*?)</loc>', (ROOT/'sitemap.xml').read_text())]

def route(path):
    p = path.relative_to(ROOT).parent.as_posix()
    return '/' if p == '.' else '/' + p + '/'

def write_changed(path, source):
    if path.exists() and path.read_text() == source: return False
    path.write_text(source); return True
