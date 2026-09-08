#!/usr/bin/env python3
"""Fail deployment on discoverability, markup or content regressions."""
import collections
import json
import re
import sys
from urllib.parse import urljoin, urlparse, unquote
from seo_html import Document, ROOT, ORIGIN, objects, route, sitemap_paths
from sync_seo import structured, editorial

errors=[]
def check(ok,message):
    if not ok: errors.append(message)

files=sitemap_paths(); paths={route(p):p for p in files}; graph={r:set() for r in paths}
titles=[]; descriptions=[]; sizes={}
for url,path in paths.items():
    s=path.read_text(); d=Document(s)
    title=d.find('title'); desc=d.find('meta',name='description'); canon=d.find('link',rel='canonical')
    check(len(title)==1 and bool(title[0].text()),url+' needs exactly one title')
    check(len(desc)==1 and bool(desc[0].attrs.get('content')),url+' needs exactly one description')
    check(len(canon)==1 and canon[0].attrs.get('href')==ORIGIN+url,url+' canonical mismatch')
    check(len(d.find('h1'))==1,url+' needs exactly one H1')
    check(not any('noindex' in n.attrs.get('content','') for n in d.find('meta',name='robots')),url+' unexpectedly noindex')
    if title: titles.append(title[0].text())
    if desc: descriptions.append(desc[0].attrs['content'])
    for n in d.find('a'):
        target=urlparse(urljoin(ORIGIN+url,n.attrs.get('href','')))
        if target.netloc!='cognis.group': continue
        p=unquote(target.path); norm=p.rstrip('/')+'/' if p!='/' else '/'
        if norm in paths: graph[url].add(norm)
        else:
            local=ROOT/p.lstrip('/')
            check(local.is_file() or (local/'index.html').is_file(),url+' broken link '+p)
    for n in d.find('img')+d.find('script')+d.find('link'):
        a=n.attrs.get('src') or (n.attrs.get('href') if n.tag=='link' and n.attrs.get('rel') in ('stylesheet','preload','modulepreload','icon') else None)
        if a and a.startswith('/') and not a.startswith('//'):
            check((ROOT/unquote(urlparse(a).path).lstrip('/')).is_file(),url+' missing resource '+a)
    for script in d.find('script',type='application/ld+json'):
        try: data=json.loads(s[script.inner:script.close])
        except Exception as e: errors.append(url+' invalid JSON-LD '+str(e)); continue
        for n in objects(data):
            if n.get('@type')=='OfferCatalog': check(len(n.get('itemListElement',[]))==3,url+' stale service catalog')
            if url.startswith('/careers/') and 'filled' in d.root.text().lower(): check(n.get('@type')!='JobPosting',url+' filled role still has JobPosting')
    check('ai.cognis.group' not in s,url+' dead product hostname')
    check('fisayo-oludare' not in s,url+' retired person reference')
    if url in ('/careers/business-development-manager/','/careers/customer-service-professional/'):
        check('filled' in d.root.text().lower(),url+' must retain the confirmed filled status')
    check(structured(s,url)==s,url+' structured data differs from visible content')
    check(editorial(s,url)==s,url+' editorial fixes missing or not idempotent')
    if url.startswith('/our-services/') and url!='/our-services/':
        sizes[url]=len(s.encode())
        check(len(s.encode())<150000,url+' exceeds 150 KB HTML budget')
        check(not d.find('link',rel='modulepreload'),url+' legacy runtime preloads returned')
        main=d.find('main'); footer=d.find('footer')
        check(bool(main and footer) and main[0].end<=footer[0].start,url+' service content follows footer')
        check(len(d.find('details'))>=3,url+' service FAQ missing')

for label,items in [('title',titles),('description',descriptions)]:
    check(len(items)==len(set(items)),'Duplicate '+label)
seen={'/'}; queue=collections.deque(['/']); depths={'/':0}
while queue:
    current=queue.popleft()
    for target in graph[current]-seen:
        seen.add(target); depths[target]=depths[current]+1; queue.append(target)
check(seen==set(paths),'Unreachable from home: '+', '.join(sorted(set(paths)-seen)))
for name in ('llms.txt','llms-full.txt'):
    text=(ROOT/name).read_text()
    for url in paths: check(ORIGIN+url in text,name+' missing '+url)
    check('ai.cognis.group' not in text,name+' dead product hostname')
check('21.1%' in (ROOT/'research/state-of-ai-african-enterprises-2026/index.html').read_text(),'Research correction missing')
check('no African country has reached 20%' not in (ROOT/'research/state-of-ai-african-enterprises-2026/index.html').read_text(),'Contradicted statistic returned')
print(json.dumps({'pages':len(paths),'reachable':len(seen),'maximum_link_depth':max(depths.values()),'service_html_bytes':sizes,'errors':errors},indent=2))
sys.exit(bool(errors))
