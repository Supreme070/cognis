#!/usr/bin/env python3
"""Assemble only public pages and assets. Never publish the repository root."""
import argparse
import shutil
from pathlib import Path
from seo_html import ROOT, sitemap_paths

p=argparse.ArgumentParser()
p.add_argument('--output',type=Path,default=ROOT/'dist')
args=p.parse_args(); out=args.output.resolve()
if out==ROOT or (out.exists() and any(out.iterdir())):
    raise SystemExit('Output must be a new or empty directory; existing data is not removed.')
out.mkdir(parents=True,exist_ok=True)
files=set(sitemap_paths())
files.update(ROOT/name for name in ['404.html','thanks/index.html','thanks-subscribe/index.html','confirm-subscription/index.html',
    '_headers','_redirects','cognis.js','responsive.css','robots.txt','sitemap.xml','llms.txt','llms-full.txt',
    'favicon.svg','favicon.ico','favicon-32.png','apple-touch-icon.png','site.webmanifest'])
extensions={'.css','.js','.mjs','.json','.png','.jpg','.jpeg','.svg','.webp','.avif','.gif','.ico','.woff','.woff2','.ttf','.mp4','.webm','.pdf','.txt'}
for folder in ['assets','framer-runtime','cognis-cms','og']:
    files.update(f for f in (ROOT/folder).rglob('*') if f.is_file() and f.suffix.lower() in extensions)
for f in sorted(files):
    if f.is_symlink(): raise SystemExit('Public symlink needs explicit review: '+str(f))
    dest=out/f.relative_to(ROOT); dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(f,dest)
print(f'Assembled {len(files)} public files in {out}')
