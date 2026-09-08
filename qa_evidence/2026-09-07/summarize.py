import collections, csv, json
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET
from audit import OUT, ORIGIN, objects

local=json.loads((OUT/'local-pages.json').read_text())
records=json.loads((OUT/'live-pages.json').read_text())
sitemap=ET.fromstring((OUT/records[0]['file']).read_text())
urls=[n.text for n in sitemap.iter() if n.tag.endswith('}loc')]
pages={r['url']:r['page'] for r in records if 'page' in r and r['url'] in urls}
incoming=collections.defaultdict(set);outgoing=collections.defaultdict(set)
for u,p in pages.items():
 for a in p['links']:
  parsed=urlparse(urljoin(u,a['href']))
  target=ORIGIN+('/' if parsed.path=='/' else parsed.path.rstrip('/')+'/')
  if parsed.hostname in ('cognis.group','www.cognis.group') and target in pages and target!=u:
   incoming[target].add(u);outgoing[u].add(target)
depth={ORIGIN+'/':0};queue=collections.deque(depth)
while queue:
 u=queue.popleft()
 for v in outgoing[u]:
  if v not in depth:depth[v]=depth[u]+1;queue.append(v)
rows=[]
for r in records:
 if r['url'] not in pages:continue
 p=r['page'];u=r['url'];row=dict(url=u,status=r['http_code'],redirects=r['num_redirects'],
  title=' | '.join(p['title']),description=' | '.join(p['description']),canonical=' | '.join(p['canonical']),
  h1=' | '.join(h['text'] for h in p['headings'] if h['tag']=='h1'),
  html_bytes=p['bytes'],transfer_bytes=r['size_download'],inline_css_bytes=p['styles_bytes'],
  body_words_including_navigation=p['words'],incoming_pages=len(incoming[u]),depth=depth.get(u,'unreachable'),
  jsonld_errors=len(p['schema_errors']),schema_types='; '.join(p['schema_types']),robots=' | '.join(p['robots']))
 rows.append(row)
with (OUT/'page-inventory.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary=dict(sitemap_pages=len(pages),http_200=sum(r['status']==200 for r in rows),
 self_canonical=sum(p['canonical']==[u] for u,p in pages.items()),
 unique_titles=len({tuple(p['title']) for p in pages.values()}),
 unique_descriptions=len({tuple(p['description']) for p in pages.values()}),
 single_h1=sum(sum(h['tag']=='h1' for h in p['headings'])==1 for p in pages.values()),
 jsonld_parse_errors=sum(len(p['schema_errors']) for p in pages.values()),
 noindex_in_sitemap=[u for u,p in pages.items() if 'noindex' in ','.join(p['robots']).lower()],
 orphan_sitemap_pages=[u for u in pages if u!=ORIGIN+'/' and not incoming[u]],
 unreachable_from_home=[u for u in pages if u not in depth],
 six_service_catalog_pages=[u for u,p in pages.items() if any(o.get('@type')=='OfferCatalog' and len(o.get('itemListElement',[]))==6 for s in p['schemas'] for o in objects(s))],
 incoming={u:sorted(incoming[u]) for u in pages},depth=depth)
(OUT/'summary.json').write_text(json.dumps(summary,indent=2))
print(json.dumps({k:v for k,v in summary.items() if k not in ('incoming','depth','six_service_catalog_pages')},indent=2))
print('Six-service catalogs:',len(summary['six_service_catalog_pages']))
print('Deep pages:',[(u,d) for u,d in depth.items() if d>=3])
