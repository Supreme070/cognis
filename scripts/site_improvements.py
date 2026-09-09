"""Source-preserving editorial and accessibility fixes from the September audit."""
import html
import re
from seo_html import Document, Node, edit

WHY_TITLE = 'Why Cognis | AI Consulting & Engineering for Africa'
WHY_HEADLINE = 'AI consulting and engineering for Africa.'
STYLE = '<link rel="stylesheet" href="/assets/site-improvements.css">'

def opening(source, node, **attrs):
    value = source[node.start:node.inner]
    for key, content in attrs.items():
        escaped = html.escape(content, quote=True)
        pattern = r'\s'+re.escape(key)+r'="[^"]*"'
        value = re.sub(pattern, '', value)
        value = value[:-1] + f' {key}="{escaped}">'
    return value

def improve(source, url):
    if url == '/why-cognis/':
        doc = Document(source); changes = []
        for n in doc.find('h1'):
            changes.append((n.inner, n.close, WHY_HEADLINE))
        for n in doc.find('title'):
            changes.append((n.inner, n.close, html.escape(WHY_TITLE)))
        for n in doc.find('meta'):
            if n.attrs.get('property', n.attrs.get('name')) in ('og:title', 'twitter:title'):
                changes.append((n.start, n.inner, opening(source, n, content=WHY_TITLE)))
        source = edit(source, changes)
        source = source.replace('Why we lead', 'Why work with Cognis')
    if url == '/case-studies/':
        source = source.replace('72% score lift', 'Before-and-after assessment')
        source = source.replace('100% Article 4 coverage', 'AI literacy records')
    # Label fields in all public forms, including the regenerated newsletter.
    doc = Document(source); changes=[]
    for form_index, form in enumerate(doc.find('form')):
        fields=[n for n in form.walk() if n.tag in ('input','textarea','select') and n.attrs.get('type')!='hidden' and n.attrs.get('aria-hidden')!='true']
        for field_index,n in enumerate(fields):
            name=n.attrs.get('name','')
            if not name: continue
            labels=[x for x in n.parent.children if isinstance(x,Node) and x.tag=='label']
            if labels:
                field_id=n.attrs.get('id') or f'cg-form-{form_index}-{name}'
                changes.append((n.start,n.inner,opening(source,n,id=field_id)))
                label=labels[0]
                changes.append((label.start,label.inner,opening(source,label,**{'for':field_id})))
            elif not n.attrs.get('aria-label') and not n.attrs.get('aria-labelledby'):
                label='Your work email' if name=='email' else name.replace('_',' ').capitalize()
                changes.append((n.start,n.inner,opening(source,n,**{'aria-label':label})))
    source=edit(source,changes)
    if url == '/contact/':
        doc=Document(source); changes=[]
        forms=[n for n in doc.find('form') if any(x.tag=='textarea' for x in n.walk())]
        if forms:
            n=forms[0]; changes.append((n.start,n.inner,opening(source,n,id='contact-form')))
        if 'data-cognis-contact-jump' not in source:
            h1=doc.find('h1')[0]; n=h1.parent
            changes.append((n.close,n.close,'<p data-cognis-contact-jump><a class="cg-contact-jump" href="#contact-form">Send an enquiry <span aria-hidden="true">↓</span></a></p>'))
        source=edit(source,changes)
    # Insert a main around the content siblings, preserving existing header/footer.
    doc=Document(source)
    if not doc.find('main') and not doc.find(role='main'):
        footer=doc.find('footer')[0]; branch=doc.find('h1')[0]
        while branch.parent is not footer.parent and branch.parent is not None:
            branch=branch.parent
        if branch.parent is not footer.parent or branch.start>=footer.start:
            raise ValueError('Review main boundary: '+url)
        source=edit(source,[(branch.start,branch.start,'<main id="cg-main">\n'),(footer.start,footer.start,'</main>\n')])
    doc=Document(source); main=(doc.find('main') or doc.find(role='main'))[0]
    changes=[]
    main_id=main.attrs.get('id') or 'cg-main'
    if not main.attrs.get('id'): changes.append((main.start,main.inner,opening(source,main,id=main_id)))
    if 'class="cg-skip-link"' not in source:
        body=doc.find('body')[0]
        changes.append((body.inner,body.inner,f'<a class="cg-skip-link" href="#{main_id}">Skip to content</a>'))
    source=edit(source,changes)
    if STYLE not in source: source=source.replace('</head>',STYLE+'\n</head>')
    return source
