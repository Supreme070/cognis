"""Additional read-only public HTTP probes for the audit."""
import concurrent.futures, hashlib, json, subprocess
from pathlib import Path
from audit import OUT, ORIGIN, fetch

urls=[
 'http://cognis.group/','https://www.cognis.group/','http://www.cognis.group/',
 ORIGIN+'/index.html',ORIGIN+'/about-us',ORIGIN+'/about-us/index.html',
 ORIGIN+'/about-us.html',ORIGIN+'/blog/why-enterprise-ai-deployments-fail/',
 ORIGIN+'/teams/fisayo-oludare/', 'https://cognis.pages.dev/',
 ORIGIN+'/index.html.before-pricing-purge',ORIGIN+'/cognis_base.original.html',
 ORIGIN+'/brand-manual/',ORIGIN+'/cms-raw/blog-chunk.framercms',
 'https://www.linkedin.com/company/cognis-group','https://github.com/cognis-group',
 'https://ai.cognis.group','https://www.marketsage.africa',
 'https://migratio.cognis.group','https://spog.cognis.group',
 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fcognis.group%2F&strategy=mobile&category=performance&category=seo',
]

def bot(args):
 name,path=args
 r=subprocess.run(['curl','-sS','--compressed','--max-time','25','-A',name,ORIGIN+path],capture_output=True)
 text=r.stdout.decode(errors='replace')
 return dict(agent=name,path=path,exitcode=r.returncode,bytes=len(r.stdout),sha256=hashlib.sha256(r.stdout).hexdigest(),challenge=('Just a moment' in text),has_longform='cognis-service-longform' in text,has_title='<title' in text)

def head(url):
 r=subprocess.run(['curl','-sS','-I','-L','--max-time','25',url],capture_output=True,text=True)
 return dict(url=url,exitcode=r.returncode,headers=r.stdout,error=r.stderr)

if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  results=list(pool.map(fetch,urls))
 (OUT/'probes.json').write_text(json.dumps(results,indent=2))
 print('URL probes',[(r['url'],r['http_code'],r['url_effective']) for r in results])
 agents=['Googlebot','bingbot','OAI-SearchBot','GPTBot','Claude-SearchBot','PerplexityBot']
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  bots=list(pool.map(bot,[(a,p) for a in agents for p in ['/','/our-services/ai-strategy-advisory/']]))
 (OUT/'bot-probes.json').write_text(json.dumps(bots,indent=2));print('Bot probes',bots)
 resources=['/assets/img/cognis-logo.png','/og/cognis-og-1200x630.jpg',
 '/framer-runtime/assets/services-hero.mp4','/framer-runtime/assets/hero-afr5.mp4',
 '/framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/script_main.DuQsiV3H.mjs',
 '/framer-runtime/sites/3RYFpGbtMJS5XyuENcvikD/framer.DPEhIzHY.mjs',
 '/assets/ask-cognis.js','/assets/blog/securing-ai-agents-2026.webp']
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  heads=list(pool.map(head,[ORIGIN+p for p in resources]))
 (OUT/'resource-headers.json').write_text(json.dumps(heads,indent=2))
 print('Resource headers saved',len(heads))
