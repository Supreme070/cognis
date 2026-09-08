#!/usr/bin/env python3
"""Read-only verification of the published sitemap and selected HTTP behavior."""
import concurrent.futures
import json
import subprocess
from pathlib import Path
from seo_html import ROOT, ORIGIN, Document, route, sitemap_paths, edit

def email_normalized(source):
    """Decode only Cloudflare's documented email XOR encoding for comparison.

    The raw HTTP response remains in evidence; this does not change live HTML.
    """
    d=Document(source); edits=[]
    for n in d.root.walk():
        value=n.attrs.get('data-cfemail')
        if not value: continue
        raw=bytes.fromhex(value)
        decoded=bytes(b ^ raw[0] for b in raw[1:]).decode('utf-8')
        edits.append((n.inner,n.close,decoded))
    return edit(source,edits)

OUT=ROOT/'qa_evidence/2026-09-08/live'
OUT.mkdir(parents=True,exist_ok=True)

def fetch(url,label):
    body=OUT/(label+'.body'); headers=OUT/(label+'.headers')
    result=subprocess.run(['curl','-sS','--compressed','--location','--max-time','30','--max-redirs','5',
        '--dump-header',str(headers),'--output',str(body),'--write-out','%{http_code}',url],capture_output=True,text=True)
    return {'url':url,'status':result.stdout,'error':result.stderr,'body':body.read_text(errors='replace') if body.exists() else '',
            'headers':headers.read_text() if headers.exists() else ''}

def page(path):
    url=route(path); r=fetch(ORIGIN+url,url.strip('/').replace('/','__') or 'home'); issues=[]
    if r['status']!='200': issues.append('HTTP '+r['status'])
    remote=Document(email_normalized(r['body'])); local=Document(path.read_text())
    for tag,attrs in [('title',{}),('h1',{}),('meta',{'name':'description'}),('link',{'rel':'canonical'})]:
        left=remote.find(tag,**attrs); right=local.find(tag,**attrs)
        values=lambda nodes:[(n.text(),n.attrs.get('content'),n.attrs.get('href')) for n in nodes]
        if values(left)!=values(right): issues.append(tag+' differs from local')
    bodies=remote.find('body')
    if not bodies or bodies[0].text()!=local.find('body')[0].text(): issues.append('Visible text differs from local')
    if any('noindex' in n.attrs.get('content','') for n in remote.find('meta',name='robots')): issues.append('noindex meta')
    if any(line.lower().startswith('x-robots-tag:') and 'noindex' in line.lower() for line in r['headers'].splitlines()): issues.append('noindex header')
    return {'route':url,'status':r['status'],'issues':issues}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    rows=list(pool.map(page,sitemap_paths()))
extras=[]
for name in ['sitemap.xml','llms.txt','llms-full.txt']:
    r=fetch(ORIGIN+'/'+name,name)
    extras.append({'url':r['url'],'status':r['status'],'pass':r['status']=='200' and r['body']==(ROOT/name).read_text()})
for url,label,expected in [
    ('https://cognis.pages.dev/','pages-alias',200),
    (ORIGIN+'/seo-audit-nonexistent-20260908/','not-found',404),
    (ORIGIN+'/scripts/sync_seo.py','internal-file',404)]:
    r=fetch(url,label); ok=r['status']==str(expected)
    if label=='pages-alias': ok=ok and 'x-robots-tag: noindex' in r['headers'].lower()
    extras.append({'url':url,'status':r['status'],'pass':ok})
report={'pages':rows,'probes':extras,'passed':all(not r['issues'] for r in rows) and all(r['pass'] for r in extras)}
(OUT.parent/'live-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pages_checked':len(rows),'page_failures':[r for r in rows if r['issues']],'probes':extras,'passed':report['passed']},indent=2))
raise SystemExit(not report['passed'])
