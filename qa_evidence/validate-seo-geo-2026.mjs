import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(), date='2026-07-26';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==='node_modules'||e.name==='brand-manual'||e.name==='.git'?[]:e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(root).filter(f=>f.endsWith('.html')&&(path.basename(f)==='index.html'||path.basename(f)==='404.html')).sort();
const text=s=>(s||'').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<svg\b[\s\S]*?<\/svg>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp|quot|#39);/g,' ').replace(/\s+/g,' ').trim();
const attr=(s,re)=>(s.match(re)||[])[1]||'';
const allTypes=(x,set=new Set)=>{if(!x||typeof x!=='object')return set;const t=x['@type'];if(typeof t==='string')set.add(t);else if(Array.isArray(t))t.forEach(v=>set.add(v));Object.values(x).forEach(v=>allTypes(v,set));return set};
const route=f=>{const rel=path.relative(root,f).replaceAll(path.sep,'/');return rel==='index.html'?'/':rel==='404.html'?'/404':`/${rel.replace(/index\.html$/,'')}`};
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const sitemapUrls=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname));
const expectedTypes=r=>{
  if(r==='/404'||r.startsWith('/thanks')) return [];
  if(r.startsWith('/blog/')&&r!=='/blog/') return ['BlogPosting','WebPage','BreadcrumbList','Person'];
  if(r==='/blog/') return ['Blog','BreadcrumbList'];
  if(r.startsWith('/teams/')) return ['ProfilePage','Person','BreadcrumbList'];
  if(r.startsWith('/our-services/')&&r!=='/our-services/') return ['Service','WebPage','BreadcrumbList','FAQPage'];
  if(r==='/our-services/') return ['CollectionPage','BreadcrumbList'];
  if(r==='/faq/') return ['FAQPage','BreadcrumbList'];
  if(r.startsWith('/case-studies/')&&r!=='/case-studies/') return ['Article','BreadcrumbList'];
  if(r==='/research/state-of-ai-african-enterprises-2026/') return ['Article','Report','BreadcrumbList'];
  return ['BreadcrumbList'];
};
const contentRoute=r=>(r.startsWith('/blog/')&&r!=='/blog/')||(r.startsWith('/case-studies/')&&r!=='/case-studies/')||r.startsWith('/research/')||r==='/best-ai-consulting-firms-africa/';
const rows=[]; let invalidJson=0;
for(const file of files){
  const html=fs.readFileSync(file,'utf8'), r=route(file), noindex=/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  const title=attr(html,/<title[^>]*>([\s\S]*?)<\/title>/i), desc=attr(html,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
  const canonical=attr(html,/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i), og=['og:title','og:description','og:image'].every(k=>new RegExp(`<meta[^>]+property=["']${k}["']`,'i').test(html));
  const blocks=[...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]; const types=new Set, errors=[];
  for(const [i,m] of blocks.entries())try{allTypes(JSON.parse(m[1]),types)}catch(e){errors.push(`${i+1}: ${e.message}`);invalidJson++}
  const body=text((html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)||[])[1]||html), first100=body.split(/\s+/).slice(0,100).join(' ');
  const qs=[...html.matchAll(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map(m=>text(m[1])).filter(h=>/\?$|^(what|why|how|when|where|who|which|can|does|do|is|are|should)\b/i.test(h));
  const internal=[...new Set([...html.matchAll(/<a\b[^>]+href=["']([^"'#?]+)["']/gi)].map(m=>m[1]).filter(h=>h.startsWith('/')&&!h.startsWith('//')))];
  const expected=expectedTypes(r), missingSchema=expected.filter(t=>!types.has(t));
  const hasDates=!contentRoute(r)||(/datePublished|article:published_time/.test(html)&&/dateModified|article:modified_time|updated/i.test(html));
  const hasByline=!r.startsWith('/blog/')||r==='/blog/'||(/rel=["']author["']|\bBy\s+[A-Z]/.test(html)&&types.has('Person'));
  const inSitemap=noindex||r==='/404'||sitemapUrls.has(r);
  const pass=(noindex||(title.length>=15&&title.length<=70&&desc.length>=60&&desc.length<=170))&&(noindex||og)&&(noindex||canonical)&&!errors.length&&!missingSchema.length&&inSitemap&&internal.length>=3&&hasDates&&hasByline;
  rows.push({route:r,indexable:!noindex,pass,title:title.length,description:desc.length,og,canonical:!!canonical,schema:[...types].sort(),missingSchema,jsonErrors:errors,internalLinks:internal.length,sitemap:inSitemap,answerFirst:first100,questionHeadings:qs.length,dates:hasDates,byline:hasByline});
}

// Local route integrity.
const routes=new Set(rows.map(x=>x.route)); const broken=[];
for(const file of files){const html=fs.readFileSync(file,'utf8'), from=route(file);for(const m of html.matchAll(/<a\b[^>]+href=["']([^"'#?]+)["']/gi)){let h=m[1];if(!h.startsWith('/')||h.startsWith('//')||/\.[a-z0-9]{2,5}$/i.test(h))continue; if(!h.endsWith('/'))h+='/';if(!routes.has(h)&&h!=='/404/')broken.push({from,to:m[1]})}}

const requiredBots=['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','PerplexityBot','Perplexity-User','Google-Extended'];
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8'), missingBots=requiredBots.filter(b=>!new RegExp(`User-agent:\\s*${b}[\\s\\S]{0,80}Allow:\\s*/`,'i').test(robots));
const summary={generated:date,pages:rows.length,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass).map(x=>x.route),invalidJson,brokenInternalLinks:broken,missingCrawlerRules:missingBots,sitemapEntries:sitemapUrls.size,llms:{short:fs.existsSync('llms.txt'),full:fs.existsSync('llms-full.txt'),expertPostsListed:POSTS_LISTED()}};
function POSTS_LISTED(){const a=fs.readFileSync('llms.txt','utf8'),b=fs.readFileSync('llms-full.txt','utf8');return ['securing-ai-agents-in-production','enterprise-rag-security-prompt-injection-data-exfiltration','ai-governance-africa-2026','from-copilot-to-coworker-productizing-ai-agents','ai-agent-product-operating-system'].every(s=>a.includes(s)&&b.includes(s))}
fs.mkdirSync('qa_evidence/2026-07-26',{recursive:true});
fs.writeFileSync('qa_evidence/2026-07-26/seo-geo-checklist.json',JSON.stringify({summary,rows},null,2));
const lines=['# SEO/GEO validation — 26 July 2026','',`Pages passing: ${summary.passed}/${summary.pages}`,`JSON-LD parse errors: ${invalidJson}`,`Broken internal links: ${broken.length}`,`Missing crawler rules: ${missingBots.length}`,`Sitemap entries: ${sitemapUrls.size}`,`Expert posts listed in both llms files: ${summary.llms.expertPostsListed?'yes':'no'}`,'','| Page | Pass | Title | Meta | OG | Schema | Links | Sitemap |','|---|---:|---:|---:|---:|---:|---:|---:|',...rows.map(x=>`| ${x.route} | ${x.pass?'✓':'✗'} | ${x.title} | ${x.description} | ${x.og?'✓':x.indexable?'✗':'n/a'} | ${x.missingSchema.length?`missing ${x.missingSchema.join(', ')}`:'✓'} | ${x.internalLinks} | ${x.sitemap?'✓':'✗'} |`)];
fs.writeFileSync('qa_evidence/2026-07-26/seo-geo-checklist.md',lines.join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
if(summary.failed.length||invalidJson||broken.length||missingBots.length||!summary.llms.expertPostsListed)process.exitCode=1;
