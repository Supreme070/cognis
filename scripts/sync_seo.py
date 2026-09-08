#!/usr/bin/env python3
"""Final, idempotent SEO pass. Keeps audit fixes across legacy prerenders.

Run after service rendering and global chrome injection. Public page output is
the source of truth for FAQ answers, article headlines and the text directory.
"""
import html
import json
import re
from seo_html import Document, Node, ROOT, ORIGIN, edit, objects, route, sitemap_paths, write_changed
from seo_editorial import RESEARCH, RELATED, FIRMS, comparison

DATE = '2026-09-08'
RETIRED = {'service-ml-data', 'service-ai-governance', 'service-digital-transformation'}
DEMO = '/contact/?interest=cognis-ai'
RESEARCH_URL='/research/state-of-ai-african-enterprises-2026/'
RESEARCH_DESCRIPTION='AI in African enterprises: sourced market forecasts, adoption measures, their limitations and a practical framework for evaluating a deployment.'

def box(body): return '<div class="seo-editorial">'+body+'</div>'

def faq_items(doc):
    pairs=[]
    for n in doc.find('details'):
        summary=next((x for x in n.children if isinstance(x,Node) and x.tag=='summary'),None)
        if summary:
            answer=' '.join(x.text() if isinstance(x,Node) else x.strip() for x in n.children if x is not summary).strip()
            if answer: pairs.append((summary.text(), re.sub(r'\s+',' ',answer)))
    for section in doc.find('section'):
        if section.attrs.get('data-screen-label') not in ('FAQ','Buyer questions'): continue
        for n in section.walk():
            children=[c for c in n.children if isinstance(c,Node) and c.text()]
            if len(children)==2 and children[0].text().endswith('?'):
                pairs.append((children[0].text(),children[1].text()))
    return [{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in dict(pairs).items()]

def editorial(source, url):
    source=source.replace('https://ai.cognis.group',ORIGIN+DEMO)
    source=source.replace('dedicated to helping organisations sharper, faster and AI-ready','dedicated to helping organisations work smarter, faster and become AI-ready')
    if url=='/why-cognis/':
        source=source.replace('Africa’s leading AI consulting firm.','AI consulting and engineering for Africa.')
        source=source.replace('Who is the leading AI consulting firm in Nigeria and Africa?','Where does Cognis work?')
        source=source.replace('Cognis Group is among the leading AI consulting and engineering firms working in Africa.','Cognis Group provides AI consulting and engineering for organisations in Africa.')
        source=source.replace('live AI products run in production, not demos','AI products across workforce, marketing, migration and operations')
    if url in ('/','/products/'):
        doc=Document(source); edits=[]
        for n in doc.find('a'):
            if 'Visit Cognis AI' in n.text():
                raw=source[n.start:n.end]
                raw=re.sub(r'href="[^"]*"',f'href="{html.escape(DEMO)}"',raw,count=1)
                raw=raw.replace(' target="_blank"','').replace('Visit Cognis AI','Request a Cognis AI demo')
                raw=re.sub(r'Live · AI [Ww]orkforce','Demo by request · AI workforce',raw)
                edits.append((n.start,n.end,raw))
        source=edit(source,edits)
    if url=='/faq/':
        source=source.replace('Four are live —','Our products include')
        source=source.replace('>Cognis AI</a>','>Cognis AI (demo by request)</a>')
    if url=='/blog/':
        source=source.replace('Five years of production AI data shows the same failure patterns.','A practical examination of common AI delivery failures.')
    if url=='/best-ai-consulting-firms-africa/':
        source=source.replace('Scoped engagements typically start in the tens of thousands of dollars for assessment and strategy phases, with build-and-deploy programmes priced against scope and duration. Beware open-ended retainers: well-run firms write the measurement contract before engineering starts, and it covers targets, cadence, and rollback criteria.', 'There is no single standard price. Ask for a scoped proposal with named deliverables, dependencies, evaluation criteria and ongoing operating costs. Compare like-for-like scopes and confirm whether handover, licences and support are included.')
    if url=='/about-us/':
        source=source.replace('Business growth','Measures agreed upfront')
    if url=='/case-studies/ai-training-programme/':
        source=source.replace('for the top 40 leaders','for senior leaders').replace('for 180 product owners','for product owners').replace('for 3,000 employees','for employees')
        source=source.replace('<strong>72%</strong><span>average assessment improvement</span>','<strong>Assessed</strong><span>before and after training</span>')
        source=source.replace('internal champions certified','internal champions trained')
        source=source.replace('with training records that met EU AI Act requirements','with records supporting its AI literacy programme')
        source=source.replace('with records that met EU AI Act requirements','with records supporting its AI literacy programme')
        source=source.replace('The programme also created the staff knowledge records required by Article 4 of the EU AI Act.','The programme also created records to support the organisation’s AI literacy programme.')
        source=source.replace('The total counts people who completed the stated training groups, and the improvement compares test results before and after training.','Participation totals are reported by Cognis for this confidential engagement and have not been independently audited here. Subgroup counts and the assessment-improvement percentage have been removed because the published evidence does not establish cohort overlap or the calculation method.')
    doc=Document(source); edits=[]
    if url=='/blog/the-real-roi-of-ai/':
        headings=doc.find('h2')
        for i,n in enumerate(headings):
            if n.text()=='What are realistic AI ROI ranges for enterprise deployments?':
                end=headings[i+1].start if i+1<len(headings) else doc.find('article')[0].close
                body='<h2>How should you estimate ROI before a deployment?</h2><p>Estimate value from your own workflow baseline. Record the task volume, handling time, errors and cost of the current process. Then include review effort, model and infrastructure charges, maintenance, training and implementation costs in the proposed alternative.</p><p>Released capacity is not automatically a cash saving. Explain how the organisation will use the time recovered, and separate realised savings from capacity and quality improvements. State the observation window and how the task mix changed.</p><p>Our <a href="/research/state-of-ai-african-enterprises-2026/">research guide includes an explicitly illustrative worked calculation</a>. The previous version’s improvement ranges have been removed because the published evidence did not establish their sample or measurement method.</p>'
                edits.append((n.start,end,body))
    if url=='/research/state-of-ai-african-enterprises-2026/':
        for label,body in RESEARCH.items():
            n=doc.find('section',data_screen_label=label)[0]
            edits.append((n.inner,n.close,box(body)))
    if url=='/best-ai-consulting-firms-africa/':
        n=doc.find('section',data_screen_label='Comparison')[0]
        edits.append((n.inner,n.close,box(comparison())))
        n=doc.find('section',data_screen_label='Firms')[0]
        body='<h2>Six providers with different areas of focus</h2>'
        for name,link,focus,fit,question in FIRMS:
            body+=f'<h3><a href="{link}">{name}</a></h3><p>{focus}. {question}</p>'
        edits.append((n.inner,n.close,box(body)))
    if url in ('/','/about-us/'):
        labels={'/':{'113':'Your stack','120':'People first','132':'One team'},'/about-us/':{'67':'Clear goals'}}[url]
        for key,value in labels.items():
            for n in doc.find(data_dc_tpl=key):
                raw=source[n.start:n.inner]
                raw=re.sub(r' data-(?:countup|cu-init)="[^"]*"','',raw)
                edits.append((n.start,n.end,raw+value+source[n.close:n.end]))
    source=edit(source,edits)
    if url==RESEARCH_URL:
        doc=Document(source); replacements=[]
        for n in doc.find('meta'):
            key=n.attrs.get('name',n.attrs.get('property',''))
            if key in ('description','og:description','twitter:description'):
                raw=re.sub(r'content="[^"]*"','content="'+html.escape(RESEARCH_DESCRIPTION)+'"',source[n.start:n.end])
                replacements.append((n.start,n.end,raw))
        source=edit(source,replacements)
    if url=='/':
        doc=Document(source); n=doc.find('section',data_screen_label='Expertise')[0]
        if 'data-seo-demo-note' not in source:
            note='<p data-seo-demo-note style="font:14px/1.6 Inter,sans-serif;color:#363636;margin:0 auto 28px;max-width:1160px">Illustrative dashboards: the sample names, task counts and percentages in this section demonstrate interface concepts and are not client results.</p>'
            source=edit(source,[(n.inner,n.inner,note)])
    doc=Document(source)
    testimonials=doc.find('section',data_screen_label='Testimonials') or doc.find('section',class_='svc-section svc-proof-section')
    if testimonials and 'data-seo-testimonial-note' not in source:
        n=testimonials[0]
        note='<p data-seo-testimonial-note style="font:14px/1.65 Inter,sans-serif;color:#4a4a4a;max-width:1160px;margin:0 auto 28px">Selected first-party testimonials. MarketSage is a Cognis product. Statements describe individual experiences; quantitative claims are not independently audited benchmarks.</p>'
        source=edit(source,[(n.inner,n.inner,note)])
    if url in RELATED and 'id="seo-related"' not in source:
        title,links=RELATED[url]
        content=box('<h2>'+title+'</h2><ul>'+''.join(f'<li><a href="{href}">{label}</a></li>' for href,label in links)+'</ul>')
        doc=Document(source)
        targets=doc.find('section',data_screen_label='CTA') or doc.find('footer')
        if not targets: raise ValueError('No related-content insertion point: '+url)
        at=targets[0].start
        source=edit(source,[(at,at,'<section id="seo-related">'+content+'</section>\n')])
    if url.startswith('/blog/') and url!='/blog/':
        doc=Document(source)
        if not any(n.attrs.get('href','').startswith('https://') and 'cognis' not in n.attrs['href'] for n in doc.find('a') if n.start>(doc.find('body')[0].start)) or url in (
          '/blog/why-most-enterprise-ai-strategies-fail-before-they-start/', '/blog/the-real-roi-of-ai/', '/blog/making-your-workforce-ai-ready/', '/blog/ai-governance-is-not-optional/', '/blog/building-ai-agents-that-actually-ship/', '/blog/ai-native-operations-for-african-enterprises/'):
            if 'id="seo-primary-sources"' not in source:
                body='<h2>Primary references</h2><p>For the risk-management and delivery practices discussed here, consult <a href="https://www.nist.gov/itl/ai-risk-management-framework">NIST’s AI Risk Management Framework</a> and <a href="https://www.anthropic.com/engineering/building-effective-agents">Anthropic’s guidance on building effective agents</a>. These explain the underlying practices; they do not independently validate Cognis’s delivery claims.</p>'
                targets=doc.find('article') or doc.find('main')
                at=targets[0].close if targets else doc.find('footer')[0].start
                source=edit(source,[(at,at,'<section id="seo-primary-sources">'+box(body)+'</section>')])
    if 'seo-editorial' in source and 'href="/assets/seo-editorial.css"' not in source:
        source=source.replace('</head>','<link rel="stylesheet" href="/assets/seo-editorial.css">\n</head>')
    return source

def structured(source,url):
    doc=Document(source); faq=faq_items(doc); h1=doc.find('h1'); edits=[]
    for script in doc.find('script',type='application/ld+json'):
        data=json.loads(source[script.inner:script.close])
        for n in objects(data):
            if n.get('@id')==ORIGIN+'/#founder': n['@id']=ORIGIN+'/teams/supreme-oyewumi/#person'
            if n.get('@type')=='OfferCatalog':
                n['itemListElement']=[x for x in n.get('itemListElement',[]) if x.get('itemOffered',{}).get('@id','').split('#')[-1] not in RETIRED]
            if n.get('@type')=='FAQPage' and faq: n['mainEntity']=faq
            types=n.get('@type',[]); types=[types] if isinstance(types,str) else types
            if h1 and any(t in types for t in ('Article','BlogPosting','Report')):
                n['headline']=h1[0].text()
                if 'id="seo-primary-sources"' in source: n['dateModified']=DATE
            if n.get('@type')=='SoftwareApplication' and n.get('name') in ('Cognis AI','CognisAI'):
                n['url']=ORIGIN+DEMO
            if url in ('/research/state-of-ai-african-enterprises-2026/','/best-ai-consulting-firms-africa/') and any(t in types for t in ('Article','Report')):
                n['dateModified']=DATE
                if url==RESEARCH_URL: n['description']=RESEARCH_DESCRIPTION
        edits.append((script.inner,script.close,json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\/')))
    return edit(source,edits)

def export_text(files):
    short=['# Cognis Group','', '> Cognis Group Limited is a Lagos-founded AI consulting and engineering company. Its three practices are strategy, workforce training and agent engineering.','', 'This directory describes public website content. Canonical HTML pages are authoritative. Inclusion in this file does not guarantee search or AI visibility.','', 'Cognis AI: request a demonstration at '+ORIGIN+DEMO+'.','', '## Pages','']
    full=['# Cognis Group — public website text','', 'Generated from canonical public HTML. This is an extraction, not independent verification of claims. Navigation, scripts and shared footer content are omitted.','']
    def markdown(n):
        if not isinstance(n,Node): return n
        if n.tag in ('script','style','template','noscript','nav','footer','svg') or 'cg-gh' in n.attrs.get('class','').split(): return ''
        inside=''.join(markdown(x) for x in n.children)
        if n.tag=='a': return f'[{n.text()}]({n.attrs.get("href","")})'
        if n.tag in ('h1','h2','h3','h4'): return '\n\n'+'#'*int(n.tag[1])+' '+n.text()+'\n\n'
        if n.tag in ('div','p','section','article','li','tr','details','summary','br'): return '\n'+inside+'\n'
        return inside
    for path in files:
        d=Document(path.read_text()); url=ORIGIN+route(path)
        title=d.find('title')[0].text(); desc=d.find('meta',name='description')[0].attrs['content']
        short.append(f'- [{title}]({url}): {desc}')
        body=d.find('main') or d.find('body')
        text='\n'.join(line.strip() for line in markdown(body[0]).splitlines())
        text=re.sub(r'\n{3,}','\n\n',text).strip()
        full.extend(['---','', 'Source: '+url,'',text,''])
    write_changed(ROOT/'llms.txt','\n'.join(short)+'\n')
    write_changed(ROOT/'llms-full.txt','\n'.join(full).rstrip()+'\n')

def main():
    changed=[]; files=sitemap_paths()
    for path in files:
        source=path.read_text(); url=route(path)
        result=structured(editorial(source,url),url)
        if write_changed(path,result): changed.append(url)
    export_text(files)
    revised={'/','/about-us/','/products/','/faq/','/why-cognis/','/blog/','/our-services/',RESEARCH_URL,'/best-ai-consulting-firms-africa/','/case-studies/ai-training-programme/',*RELATED}
    revised.update(route(p) for p in files if 'id="seo-primary-sources"' in p.read_text())
    def stamp(match):
        block=match.group(0); loc=re.search(r'<loc>(.*?)</loc>',block).group(1)
        if loc.removeprefix(ORIGIN) in revised:
            block=re.sub(r'<lastmod>.*?</lastmod>','<lastmod>'+DATE+'</lastmod>',block)
        return block
    sitemap=ROOT/'sitemap.xml'
    write_changed(sitemap,re.sub(r'<url>.*?</url>',stamp,sitemap.read_text(),flags=re.S))
    print(f'SEO synchronization: {len(changed)} pages changed; {len(files)} pages exported')

if __name__=='__main__': main()
