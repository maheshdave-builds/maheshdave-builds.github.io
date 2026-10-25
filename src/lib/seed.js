import { profile as baseProfile } from '../data/profile'
import { experienceItems } from '../data/experience'
import { projectItems } from '../data/projects'
import { skills as certifications } from '../data/skills'
import { techStack } from '../data/skills'

// The bundled fallback content. This is what the site renders when Supabase is
// not configured or unreachable, and what the admin's "restore defaults" uses.
// It is derived from the resume and the pre-existing data files — no invented
// employment, clients, testimonials or metrics.

const education = [
  {
    degree: 'Master of Computer Applications (MCA)',
    school: 'Saurashtra University, Rajkot, India',
    year: '2018',
    detail: 'First Class with Distinction · 75.66% · Second Rank in University',
  },
  {
    degree: 'Bachelor of Computer Applications (BCA)',
    school: 'Shree Swaminarayan College of Computer Science, Bhavnagar',
    year: '2015',
    detail: 'First Class · 64.49%',
  },
  {
    degree: 'H.S.C. — Commerce',
    school: 'Dakshinamurti Vinaymandir, Bhavnagar',
    year: '2012',
    detail: 'First Class · 67.57%',
  },
]

const socials = {
  linkedin: 'https://in.linkedin.com/in/mahesh-dave-808732154',
  github: 'https://github.com/maheshdave119',
  stackexchange: 'https://magento.stackexchange.com/users/70881/mahesh-dave',
}

// Project cards are split by the product/edition stated in the resume. Client
// names and URLs come from the existing project list; descriptions stay factual.
const commerceClients = [
  { title: 'Rev-A-Shelf', category: 'Adobe Commerce Cloud', url: 'https://rev-a-shelf.com/' },
  { title: 'Who Has It?', category: 'Adobe Commerce Cloud', url: 'https://whohasit.co/' },
  { title: 'Midas Furniture', category: 'Adobe Commerce Cloud', url: 'https://midasfurniture.com/' },
  { title: 'American Lighting', category: 'Adobe Commerce Cloud', url: 'https://ace.americanlighting.com/' },
  { title: 'Melissa', category: 'Adobe Commerce Cloud', url: 'https://melissa.com.sg/' },
  { title: 'RAK Ceramics', category: 'Adobe Commerce Cloud', url: 'https://onlineshop.rakceramics.com/' },
  { title: 'Okapius — Hyvä Storefront', category: 'Adobe Commerce Cloud', url: '' },
  { title: 'Tent and Table', category: 'Adobe Commerce Enterprise', url: 'https://tentandtable.net/' },
  { title: 'TDot Performance', category: 'Adobe Commerce Enterprise', url: 'https://www.tdotperformance.ca/' },
  { title: 'RP Tech India', category: 'Adobe Commerce Enterprise', url: 'https://rptechindia.com/' },
  { title: 'Tools Plus', category: 'Adobe Commerce Enterprise', url: 'https://www.toolsplus.com/' },
  { title: 'Noctua', category: 'Magento Open Source', url: 'https://noctua.at/' },
  { title: 'Bokacha', category: 'Magento Open Source', url: 'https://www.bokacha.com/' },
  { title: 'Pool Spot', category: 'Magento Open Source', url: 'https://www.poolspot.com.au/' },
  { title: 'Deadwood Knives', category: 'Magento Open Source', url: 'https://deadwoodknives.com/' },
]

const standaloneProjects = projectItems.filter((project) => !project.clientLinks && !/odoo connector|salesforce integration/i.test(project.title))
const innovationProjects = [
  {
    title: 'AI-Assisted Engineering Workflow', category: 'AI & Innovation',
    description: 'Introduced AI pair-programming and LLM-assisted code-review workflows with a curated internal prompt library and review checklists to improve delivery consistency.',
    techStack: ['GitHub Copilot', 'LLM workflows', 'Code review'],
  },
  {
    title: 'AI-Driven Catalog Enrichment', category: 'AI & Innovation',
    description: 'Built LLM-powered tooling to help generate product descriptions, SEO metadata, and image alt text for large product catalogs.',
    techStack: ['LLM APIs', 'Catalog enrichment', 'SEO'],
  },
  {
    title: 'Adobe Sensei & Live Search', category: 'AI & Innovation',
    description: 'Worked with AI-powered product recommendations and Live Search capabilities to support product discovery.',
    techStack: ['Adobe Sensei', 'Live Search', 'Product discovery'],
  },
  {
    title: 'Conversational Commerce', category: 'AI & Innovation',
    description: 'Explored LLM-backed support experiences connected to commerce order and catalog APIs for order-status and FAQ assistance.',
    techStack: ['LLM integration', 'Commerce APIs', 'Customer support'],
  },
  {
    title: 'MCP & Developer Tooling', category: 'AI & Innovation',
    description: 'Explored Model Context Protocol servers connecting AI assistants with Adobe Commerce environments, developer workflows, and logs.',
    techStack: ['MCP', 'Developer tooling', 'AI assistants'],
  },
]

const integrationProjects = [
  {
    title: 'Adobe App Builder — Odoo Connector', category: 'Integrations & APIs',
    description: 'Real-time Adobe Commerce and Odoo ERP integration using event-driven flows with Adobe I/O Events. Published on Adobe Exchange with monitoring and logging.',
    techStack: ['Adobe App Builder', 'Odoo ERP', 'Adobe I/O Events'],
    url: 'https://exchange.adobe.com/apps/ec/abt7pvp37o/odoo-connector-for-adobe-commerce',
    linkLabel: 'View on Adobe Exchange',
  },
  {
    title: 'Adobe Commerce — Salesforce Integration', category: 'Integrations & APIs',
    description: 'Bi-directional synchronization of customer, order, and product data using Jitterbit; the resume reports a 99% improvement in data accuracy and elimination of manual entry.',
    techStack: ['Adobe Commerce', 'Salesforce', 'Jitterbit'],
  },
  {
    title: 'Magento–Odoo Connector', category: 'Integrations & APIs',
    description: 'Implemented Magento–Odoo connector functionality for product, inventory, and order synchronization.',
    techStack: ['Magento', 'Odoo ERP', 'Product sync', 'Inventory sync'],
  },
]

export const seedProjects = [
  ...standaloneProjects.map((project, index) => {
    const title = project.title.toLowerCase()
    let category = 'Headless & Storefronts'
    if (title.includes('salesforce')) category = 'Integrations & APIs'
    if (title.includes('odoo')) category = 'Integrations & APIs'
    if (title.includes('optimizer')) category = 'Adobe Commerce Platform'
    return {
      id: `seed-project-${index}`,
      title: project.title,
      category,
      description: project.description,
      techStack: project.techStack,
      url: project.url || '',
      linkLabel: project.linkLabel || 'View project',
      clientLinks: [],
      is_published: true,
    }
  }),
  ...integrationProjects.map((project, index) => ({
    id: `seed-integration-${index}`,
    ...project,
    clientLinks: [],
    is_published: true,
  })),
  ...commerceClients.map((client, index) => ({
    id: `seed-client-${index}`,
    ...client,
    description: client.category === 'Adobe Commerce Cloud'
      ? 'Adobe Commerce Cloud implementation listed in the 2026 resume.'
      : client.category === 'Adobe Commerce Enterprise'
        ? 'Adobe Commerce Enterprise implementation listed in the 2026 resume.'
        : 'Magento 2 Open Source implementation listed in the 2026 resume.',
    techStack: client.category === 'Magento Open Source'
      ? ['Magento 2 Open Source', 'Adobe Commerce']
      : [client.category, 'Magento 2'],
    linkLabel: client.url ? 'Visit project' : 'Project reference',
    clientLinks: [],
    is_published: true,
  })),
  ...innovationProjects.map((project, index) => ({
    id: `seed-innovation-${index}`,
    ...project,
    url: '',
    linkLabel: 'Project details',
    clientLinks: [],
    is_published: true,
  })),
  {
    id: 'seed-community',
    title: 'Magento Community & Knowledge Sharing',
    category: 'Community & Knowledge',
    description: 'Community participation and technical knowledge sharing through the Magento Stack Exchange profile.',
    techStack: ['Magento', 'Technical Q&A', 'Knowledge sharing'],
    url: socials.stackexchange,
    linkLabel: 'View community profile',
    clientLinks: [],
    is_published: true,
  },
  {
    id: 'seed-resume-2026',
    title: 'Mahesh Dave — Resume 2026',
    category: 'Professional Resources',
    description: 'Download the 2026 resume covering Adobe Commerce experience, integrations, AI initiatives, certifications, and education.',
    techStack: ['Resume PDF', 'Adobe Commerce', 'Engineering Leadership'],
    url: '/Mahesh_Dave_Resume_2026.pdf',
    linkLabel: 'View resume PDF',
    clientLinks: [],
    is_published: true,
  },
]
export const seedCertifications = certifications.map((cert, index) => ({
  id: `seed-cert-${index}`,
  name: cert.name,
  issuer: 'Adobe',
  year: '',
  verificationUrl: cert.verificationUrl || '',
  image: '',
  is_published: true,
}))

export const seedExperience = experienceItems.map((item, index) => ({
  id: `seed-exp-${index}`,
  ...item,
  is_published: true,
}))

export const seedEducation = education.map((item, index) => ({
  id: `seed-edu-${index}`,
  ...item,
  is_published: true,
}))

export const seedProfile = {
  ...baseProfile,
  social_urls: socials,
  profileImage: '/profile.jpg',
  resumeUrl: '/Mahesh_Dave_Resume_2026.pdf',
  availability: 'Open to architecture and engineering-leadership conversations',
}

export const DEFAULT_COPY = {
  heroEyebrow: 'ADOBE COMMERCE · ARCHITECTURE · LEADERSHIP',
  heroHeadline: 'Engineering commerce that works harder.',
  aboutTitle: 'Technical depth. People-first delivery.',
  aboutDescription:
    'Connecting architecture, engineering execution, and team growth to build commerce platforms that last.',
  experienceTitle: 'Experience built in production.',
  experienceDescription:
    'A progression from hands-on Magento development to technical leadership and solution architecture.',
  projectsTitle: 'Commerce work with real-world impact.',
  projectsDescription: 'Selected commerce implementations, integrations, and client storefronts.',
  certificationsTitle: 'Credentials that back the craft.',
  certificationsDescription: 'Adobe credentials and product foundations, with verification links where available.',
  educationTitle: 'The foundation behind the practice.',
  educationDescription: 'Academic background and qualifications.',
  toolkitTitle: 'A practical, modern toolkit.',
  toolkitDescription:
    'Platforms, patterns, and tools used across commerce, integrations, frontend, infrastructure, and delivery.',
  articlesTitle: 'Articles from the work.',
  articlesDescription:
    'Practical notes on Adobe Commerce, integration architecture, performance, and AI-assisted engineering.',
  articlesPageTitle: 'Articles from the work.',
  articlesPageDescription: 'Practical notes on Adobe Commerce, integration architecture, performance, and AI-assisted engineering.',
  contactTitle: 'Good work starts with a conversation.',
  contactDescription:
    'Have a commerce challenge, integration idea, or engineering question? I’d be glad to connect.',
}

export const DEFAULT_STATS = [
  { value: '9+', label: 'Years in commerce engineering' },
  { value: '8+', label: 'People led across delivery teams' },
  { value: '99%', label: 'Data accuracy improvement reported on Salesforce integration' },
  { value: '35%', label: 'Faster PR turnaround after AI workflow adoption' },
]

export const seedSite = {
  siteTitle: 'Mahesh Dave · Adobe Commerce Engineering',
  siteDescription:
    'Mahesh Dave — Adobe Commerce Team Lead specializing in enterprise commerce architecture, headless storefronts, integrations, and AI-assisted engineering.',
  siteLogo: '',
  copy: DEFAULT_COPY,
  stats: DEFAULT_STATS,
  techStack,
  contactEmail: 'davemahesh119@gmail.com',
  showClientProjects: true,
}

/** Empty content shape used before anything loads; keeps consumers null-safe. */
export const emptyContent = {
  profile: seedProfile,
  projects: [],
  certifications: [],
  experience: [],
  education: [],
  articles: [],
  site: seedSite,
}

export const fallbackContent = {
  profile: seedProfile,
  projects: seedProjects,
  certifications: seedCertifications,
  experience: seedExperience,
  education: seedEducation,
  articles: [],
  site: seedSite,
}
