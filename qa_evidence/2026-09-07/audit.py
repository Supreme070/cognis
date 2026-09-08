"""Read-only SEO crawl; writes evidence beside this script, never site files."""
import concurrent.futures, collections, csv, hashlib, json, re, subprocess, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
ORIGIN = 'https://cognis.group'
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

class Node:
    def __init__(self, tag='', attrs=None, line=0):
        self.tag, self.attrs, self.line, self.children = tag, dict(attrs or []), line, []
    def text(self, skip=True):
        if skip and self.tag in ('script','style','template','noscript'): return ''
        return ' '.join(c.text(skip) if isinstance(c,Node) else c for c in self.children)
    def walk(self):
        yield self
        for c in self.children:
            if isinstance(c,Node): yield from c.walk()

class Parser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root=Node(); self.stack=[self.root]; self.feed(html)
    def handle_starttag(self, tag, attrs):
        n=Node(tag,attrs,self.getpos()[0]); self.stack[-1].children.append(n)
        if tag not in VOID: self.stack.append(n)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID: self.handle_endtag(tag)
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag == tag:
                self.stack=self.stack[:i]; break
    def handle_data(self,data): self.stack[-1].children.append(data)

def clean(s): return re.sub(r'\s+',' ',s).strip()
def objects(value):
    if isinstance(value,dict):
        yield value
        for v in value.values(): yield from objects(v)
    elif isinstance(value,list):
        for v in value: yield from objects(v)

def parse(html,url):
    p=Parser(html); nodes=list(p.root.walk()); tags=lambda tag:[n for n in nodes if n.tag==tag]
    meta=collections.defaultdict(list)
    for n in tags('meta'): meta[n.attrs.get('name',n.attrs.get('property','')).lower()].append(n.attrs.get('content',''))
    schemas=[]; errors=[]
    for n in tags('script'):
        if n.attrs.get('type')=='application/ld+json':
            try: schemas.append(json.loads(n.text(False)))
            except Exception as e: errors.append(str(e))
    links=[dict(href=n.attrs.get('href',''),text=clean(n.text()),line=n.line) for n in tags('a')]
    body=tags('body'); main=tags('main') or tags('article') or body
    text=clean(' '.join(n.text() for n in body))
    record={'url':url,'bytes':len(html.encode()),'title':[clean(n.text()) for n in tags('title')],
        'description':meta['description'],'robots':meta['robots'], 'googlebot':meta['googlebot'],
        'canonical':[n.attrs.get('href') for n in tags('link') if n.attrs.get('rel')=='canonical'],
        'hreflang':[n.attrs for n in tags('link') if 'hreflang' in n.attrs],
        'lang':[n.attrs.get('lang') for n in tags('html')],
        'headings':[{'tag':n.tag,'text':clean(n.text()),'line':n.line} for n in nodes if n.tag in ('h1','h2','h3')],
        'text':text,'words':len(text.split()),'main_words':len(clean(' '.join(n.text() for n in main)).split()),
        'meta':dict(meta),'schemas':schemas,'schema_errors':errors,
        'schema_types':dict(collections.Counter(str(n['@type']) for s in schemas for n in objects(s) if '@type' in n)),
        'links':links,'images':[dict(n.attrs,line=n.line) for n in tags('img')],
        'scripts':[dict(n.attrs,inline_bytes=len(n.text(False).encode()),line=n.line) for n in tags('script')],
        'styles_bytes':sum(len(n.text(False).encode()) for n in tags('style')),
        'resources':[dict(n.attrs,tag=n.tag,line=n.line) for n in nodes if n.tag in ('link','video','source','iframe')],
        'ids':[n.attrs['id'] for n in nodes if 'id' in n.attrs],
        'nosnippet_elements':sum('data-nosnippet' in n.attrs for n in nodes),
        'hidden_elements':[dict(tag=n.tag,attrs=n.attrs,text=clean(n.text())[:240],line=n.line) for n in nodes if 'display:none' in n.attrs.get('style','').replace(' ','') or 'hidden' in n.attrs],
        'tables':len(tags('table')),'details':len(tags('details'))}
    return record

def slug(url):
    p=urlparse(url)
    return (p.netloc+'__'+p.path.strip('/').replace('/','__') or 'home')+('__'+p.query.replace('/','_') if p.query else '')

def fetch(url):
    dest=OUT/'live'; dest.mkdir(exist_ok=True)
    name=slug(url); body=dest/(name+'.body'); headers=dest/(name+'.headers')
    r=subprocess.run(['curl','-sS','-L','--max-redirs','8','--max-time','30','--compressed','-D',str(headers),'-o',str(body),'-w','%{json}',url],capture_output=True,text=True)
    try: metrics=json.loads(r.stdout)
    except Exception: metrics={'error':r.stderr}
    metrics={k:metrics.get(k) for k in ('url_effective','http_code','num_redirects','content_type','size_download','time_starttransfer','time_total','exitcode','errormsg','error')}
    metrics.update(url=url,file=str(body.relative_to(OUT)))
    if body.exists() and 'text/html' in (metrics.get('content_type') or ''):
        metrics['page']=parse(body.read_text(errors='replace'),url)
    return metrics

def local():
    pages=[]
    for file in sorted(ROOT.rglob('index.html')):
        rel=file.relative_to(ROOT)
        if any(part in ('node_modules','.git','brand-manual','qa_evidence','tests','playwright-screenshots','framer-runtime') for part in rel.parts): continue
        url=ORIGIN+'/'+(str(rel.parent)+'/' if str(rel.parent)!='.' else '')
        record=parse(file.read_text(),url); record['file']=str(rel); pages.append(record)
    record=parse((ROOT/'404.html').read_text(),ORIGIN+'/404.html'); record['file']='404.html'; pages.append(record)
    (OUT/'local-pages.json').write_text(json.dumps(pages,indent=2))
    print('Local pages:',len(pages))

def live():
    sitemap=fetch(ORIGIN+'/sitemap.xml')
    xml=(OUT/sitemap['file']).read_text()
    urls=[n.text for n in ET.fromstring(xml).iter() if n.tag.endswith('}loc')]
    extras=['/robots.txt','/llms.txt','/llms-full.txt','/404.html','/seo-audit-nonexistent-20260907/','/thanks/','/thanks-subscribe/','/confirm-subscription/']
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(fetch,urls+[ORIGIN+p for p in extras]))
    (OUT/'live-pages.json').write_text(json.dumps([sitemap]+results,indent=2))
    print('Live sitemap entries:',len(urls),'fetches:',len(results)+1)
    print('Status counts:',dict(collections.Counter(r.get('http_code') for r in results)))

if __name__=='__main__':
    OUT.mkdir(exist_ok=True)
    if '--live' in sys.argv: live()
    else: local()
