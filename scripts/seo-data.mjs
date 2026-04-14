/* Per-route SEO data + JSON-LD schema.
 * Consumed by prerender_routes.mjs to inject route-specific <title>,
 * description, canonical, og:*, and schema into snapshot HTML.
 */

export const ORIGIN = 'https://cognis.group';

const ORG_ID = `${ORIGIN}/#organization`;
const WEBSITE_ID = `${ORIGIN}/#website`;
const FOUNDER_ID = `${ORIGIN}/#founder`;

// Authors / team — mirrored by Person entries on the homepage @graph.
const AUTHOR_SUPREME = {
  '@type': 'Person',
  '@id': FOUNDER_ID,
  name: 'Supreme Oyewumi',
  jobTitle: 'Founder & CEO',
  url: `${ORIGIN}/about-us`,
  worksFor: { '@id': ORG_ID },
};

// Team members — used to prerender /teams/:id detail snapshots.
// Roles pulled verbatim from the about-us snapshot team carousel.
export const TEAM_MEMBERS = [
  {
    id: 'supreme-oyewumi',
    name: 'Supreme Oyewumi',
    jobTitle: 'Founder & CEO',
    image: '/framer-runtime/images/QnjDKI0euXnnnPi4GtTEaqYDJLo.png',
  },
  {
    id: 'kola-olatunde',
    name: 'Kola Olatunde',
    jobTitle: 'AI Cybersecurity & Governance Lead',
    image: '/framer-runtime/images/QTiI3J2XXGOwJw3fyXhxuB92fl0.png',
  },
  {
    id: 'fisayo-oludare',
    name: 'Fisayo Oludare',
    jobTitle: 'Executive Director, Partnerships & AI Enablement',
    image: '/framer-runtime/images/il73eZeVzET6bn72svJVyQpD4.png',
  },
];

// Blog posts — headline, date, body excerpt, hero image, author.
export const BLOG_POSTS = [
  {
    slug: 'why-most-enterprise-ai-strategies-fail-before-they-start',
    headline: 'Why Most Enterprise AI Strategies Fail Before They Start',
    description:
      'Enterprise AI fails at the whiteboard, not the model. The signals that separate strategies that ship from decks that don\'t.',
    datePublished: '2026-03-18',
    dateModified: '2026-04-10',
    image: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    keywords: ['AI strategy', 'enterprise AI', 'AI adoption', 'AI consulting'],
  },
  {
    slug: 'building-ai-agents-that-actually-ship',
    headline: 'Building AI Agents That Actually Ship',
    description:
      'Most agent projects stall in the demo phase. A deployment-first approach to agent engineering — what to build, what to skip, and how to keep them alive in production.',
    datePublished: '2026-03-25',
    dateModified: '2026-04-10',
    image: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    keywords: ['AI agents', 'agent engineering', 'LLM agents', 'production AI'],
  },
  {
    slug: 'ai-governance-is-not-optional',
    headline: 'AI Governance Is Not Optional',
    description:
      'EU AI Act, NIST AI RMF, ISO 42001, NDPA. Governance is the foundation of AI that scales — here\'s the framework that maps regulation to engineering.',
    datePublished: '2026-04-01',
    dateModified: '2026-04-10',
    image: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    keywords: ['AI governance', 'EU AI Act', 'NIST AI RMF', 'ISO 42001', 'AI compliance'],
  },
  {
    slug: 'the-real-roi-of-ai',
    headline: 'The Real ROI of AI',
    description:
      'Time-to-value, decision velocity, and cost avoidance — the metrics that actually matter when you measure AI in the enterprise.',
    datePublished: '2026-04-03',
    dateModified: '2026-04-10',
    image: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    keywords: ['AI ROI', 'AI business value', 'AI metrics', 'AI investment'],
  },
  {
    slug: 'making-your-workforce-ai-ready',
    headline: 'Making Your Workforce AI-Ready',
    description:
      'AI literacy is a capability, not a workshop. The training framework that turns functional teams into AI-fluent operators.',
    datePublished: '2026-04-06',
    dateModified: '2026-04-10',
    image: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    keywords: ['AI training', 'AI literacy', 'workforce development', 'AI upskilling'],
  },
  {
    slug: 'ai-native-operations-for-african-enterprises',
    headline: 'AI-Native Operations for African Enterprises',
    description:
      'African data, African regulation, African infrastructure. Why AI deployment on the continent requires context, not translation.',
    datePublished: '2026-04-08',
    dateModified: '2026-04-10',
    image: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    keywords: ['African AI', 'AI Nigeria', 'AI Africa', 'emerging markets AI', 'NDPA'],
  },
];

// Service detail pages.
export const SERVICES = [
  {
    slug: 'ai-strategy-advisory',
    name: 'AI Strategy & Advisory',
    title: 'AI Strategy & Advisory | Cognis Group',
    description:
      'AI strategy that ships. Roadmaps, opportunity maps, and executive advisory grounded in what production AI actually takes.',
    serviceType: 'AI Strategy Consulting',
  },
  {
    slug: 'ai-training-workforce-development',
    name: 'AI Training & Workforce Development',
    title: 'AI Training & Workforce Development | Cognis Group',
    description:
      'Turn functional teams into AI-fluent operators. Role-based curriculum for executives, managers, and practitioners.',
    serviceType: 'AI Training',
  },
  {
    slug: 'ai-agent-automation-engineering',
    name: 'AI Agent & Automation Engineering',
    title: 'AI Agent & Automation Engineering | Cognis Group',
    description:
      'Agents, copilots, and automation pipelines built for production — integrated, observable, and governed.',
    serviceType: 'AI Agent Engineering',
  },
];

// Breadcrumb helper.
function crumbs(...items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

// Build a route list consumed by the prerenderer. Each entry carries
// everything needed to rewrite the head + schema of a snapshot.
export const ROUTES = [
  // Top-level — written as flat *.html files (matches legacy _redirects).
  {
    path: '/about-us',
    out: 'about-us/index.html',
    title: 'About Us | Cognis Group',
    description:
      'Cognis Group is a global AI consulting firm building intelligent agents, strategy, training, and governance frameworks. Quod Tango Muto.',
    ogImage: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    extraSchema: [
      {
        '@type': 'AboutPage',
        '@id': `${ORIGIN}/about-us#webpage`,
        url: `${ORIGIN}/about-us`,
        name: 'About Cognis Group',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': ORG_ID },
        breadcrumb: crumbs(
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'About', url: `${ORIGIN}/about-us` },
        ),
      },
    ],
  },
  {
    path: '/our-services',
    out: 'our-services/index.html',
    title: 'Our Services | Cognis Group',
    description:
      'Strategy, agent engineering, workforce training, and AI governance — the disciplines that move AI from slide deck to production.',
    ogImage: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    extraSchema: [
      {
        '@type': 'CollectionPage',
        '@id': `${ORIGIN}/our-services#webpage`,
        url: `${ORIGIN}/our-services`,
        name: 'Cognis Group Services',
        isPartOf: { '@id': WEBSITE_ID },
        breadcrumb: crumbs(
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'Services', url: `${ORIGIN}/our-services` },
        ),
      },
    ],
  },
  {
    path: '/contact',
    out: 'contact/index.html',
    title: 'Contact | Cognis Group',
    description:
      'Talk to Cognis Group about AI strategy, agent engineering, and governance. Lagos, Nigeria — engaged globally.',
    ogImage: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    extraSchema: [
      {
        '@type': 'ContactPage',
        '@id': `${ORIGIN}/contact#webpage`,
        url: `${ORIGIN}/contact`,
        name: 'Contact Cognis Group',
        isPartOf: { '@id': WEBSITE_ID },
        breadcrumb: crumbs(
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'Contact', url: `${ORIGIN}/contact` },
        ),
      },
    ],
  },
  {
    path: '/blog',
    out: 'blog/index.html',
    title: 'Blog | Cognis Group',
    description:
      'Notes from the field on AI strategy, agent engineering, governance, and operating AI in production.',
    ogImage: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    extraSchema: [
      {
        '@type': 'Blog',
        '@id': `${ORIGIN}/blog#blog`,
        url: `${ORIGIN}/blog`,
        name: 'Cognis Group Blog',
        isPartOf: { '@id': WEBSITE_ID },
        publisher: { '@id': ORG_ID },
        blogPost: BLOG_POSTS.map((p) => ({
          '@type': 'BlogPosting',
          '@id': `${ORIGIN}/blog/${p.slug}#article`,
          headline: p.headline,
          url: `${ORIGIN}/blog/${p.slug}`,
          datePublished: p.datePublished,
          dateModified: p.dateModified,
        })),
        breadcrumb: crumbs(
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'Blog', url: `${ORIGIN}/blog` },
        ),
      },
    ],
  },

  // Service detail pages — written to <slug>/index.html under our-services/.
  ...SERVICES.map((s) => ({
    path: `/our-services/${s.slug}`,
    out: `our-services/${s.slug}/index.html`,
    title: s.title,
    description: s.description,
    ogImage: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    extraSchema: [
      {
        '@type': 'Service',
        '@id': `${ORIGIN}/our-services/${s.slug}#service`,
        name: s.name,
        description: s.description,
        serviceType: s.serviceType,
        provider: { '@id': ORG_ID },
        areaServed: ['Africa', 'Europe', 'Americas'],
        url: `${ORIGIN}/our-services/${s.slug}`,
      },
      {
        '@type': 'WebPage',
        '@id': `${ORIGIN}/our-services/${s.slug}#webpage`,
        url: `${ORIGIN}/our-services/${s.slug}`,
        name: s.title,
        isPartOf: { '@id': WEBSITE_ID },
        primaryImageOfPage: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
        breadcrumb: crumbs(
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'Services', url: `${ORIGIN}/our-services` },
          { name: s.name, url: `${ORIGIN}/our-services/${s.slug}` },
        ),
      },
    ],
  })),

  // Team detail pages — written to <id>/index.html under teams/.
  ...TEAM_MEMBERS.map((m) => ({
    path: `/teams/${m.id}`,
    out: `teams/${m.id}/index.html`,
    title: `${m.name} — ${m.jobTitle} | Cognis Group`,
    description: `${m.name}, ${m.jobTitle} at Cognis Group.`,
    ogImage: `${ORIGIN}/og/cognis-og-1200x630.jpg`,
    extraSchema: [
      {
        '@type': 'Person',
        '@id': `${ORIGIN}/teams/${m.id}#person`,
        name: m.name,
        jobTitle: m.jobTitle,
        image: `${ORIGIN}${m.image}`,
        url: `${ORIGIN}/teams/${m.id}`,
        worksFor: { '@id': ORG_ID },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${ORIGIN}/teams/${m.id}` },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${ORIGIN}/teams/${m.id}#webpage`,
        url: `${ORIGIN}/teams/${m.id}`,
        name: `${m.name} — ${m.jobTitle}`,
        isPartOf: { '@id': WEBSITE_ID },
        breadcrumb: crumbs(
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'About', url: `${ORIGIN}/about-us` },
          { name: m.name, url: `${ORIGIN}/teams/${m.id}` },
        ),
      },
    ],
  })),

  // Blog detail pages — written to <slug>/index.html under blog/.
  ...BLOG_POSTS.map((p) => ({
    path: `/blog/${p.slug}`,
    out: `blog/${p.slug}/index.html`,
    title: `${p.headline} | Cognis Group`,
    description: p.description,
    ogImage: p.image,
    extraSchema: [
      {
        '@type': 'BlogPosting',
        '@id': `${ORIGIN}/blog/${p.slug}#article`,
        headline: p.headline,
        description: p.description,
        image: [p.image],
        datePublished: p.datePublished,
        dateModified: p.dateModified,
        author: AUTHOR_SUPREME,
        publisher: { '@id': ORG_ID },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${ORIGIN}/blog/${p.slug}` },
        url: `${ORIGIN}/blog/${p.slug}`,
        keywords: p.keywords.join(', '),
        inLanguage: 'en-GB',
        isPartOf: { '@id': `${ORIGIN}/blog#blog` },
        breadcrumb: crumbs(
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'Blog', url: `${ORIGIN}/blog` },
          { name: p.headline, url: `${ORIGIN}/blog/${p.slug}` },
        ),
      },
    ],
  })),
];
