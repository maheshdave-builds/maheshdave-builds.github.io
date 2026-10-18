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

// Projects without clientLinks become standalone cards; the one project that
// carries clientLinks provides the client logo row.
const standaloneProjects = projectItems.filter((project) => !project.clientLinks)
const clientProject = projectItems.find((project) => project.clientLinks)

const innovationProjects = [
  {
    title: 'AI-Assisted Engineering Workflow',
    category: 'AI & innovation',
    description:
      'Introduced AI pair-programming and LLM-assisted code-review workflows with a curated internal prompt library and review checklists to improve delivery consistency.',
    techStack: ['AI-assisted development', 'LLM workflows', 'Code review'],
  },
  {
    title: 'AI-Driven Catalog Enrichment',
    category: 'AI & innovation',
    description:
      'Built LLM-powered tooling to help generate product descriptions, SEO metadata, and image alt text for large product catalogs.',
    techStack: ['LLM APIs', 'Catalog enrichment', 'SEO'],
  },
  {
    title: 'Adobe Sensei & Live Search',
    category: 'AI & innovation',
    description:
      'Implemented AI-powered product recommendations and Live Search capabilities to support product discovery and on-site conversion.',
    techStack: ['Adobe Sensei', 'Live Search', 'Product discovery'],
  },
  {
    title: 'Conversational Commerce',
    category: 'AI & innovation',
    description:
      'Integrated LLM-backed support experiences with commerce order and catalog APIs for automated order-status and FAQ assistance.',
    techStack: ['LLM integration', 'Commerce APIs', 'Customer support'],
  },
  {
    title: 'MCP & Developer Tooling',
    category: 'AI & innovation',
    description:
      'Explored Model Context Protocol servers connecting AI assistants with Adobe Commerce environments, developer workflows, and logs.',
    techStack: ['MCP', 'Developer tooling', 'AI assistants'],
  },
  {
    title: 'Okapius — Hyvä Storefront',
    category: 'Client implementation',
    description:
      'Listed in the resume under Adobe Commerce Cloud Edition and Hyvä storefront work. A public URL was not provided.',
    techStack: ['Adobe Commerce Cloud', 'Hyvä', 'Magento 2'],
  },
]

export const seedProjects = [
  ...standaloneProjects.map((project, index) => ({
    id: `seed-project-${index}`,
    title: project.title,
    category: 'Featured project',
    description: project.description,
    techStack: project.techStack,
    url: project.url || '',
    linkLabel: project.linkLabel || 'View project',
    clientLinks: [],
    is_published: true,
  })),
  ...innovationProjects.map((project, index) => ({
    id: `seed-innovation-${index}`,
    ...project,
    url: '',
    linkLabel: 'View project',
    clientLinks: [],
    is_published: true,
  })),
  ...(clientProject
    ? [
        {
          id: 'seed-clients',
          title: clientProject.title,
          category: 'Client implementations',
          description: clientProject.description,
          techStack: clientProject.techStack,
          url: '',
          linkLabel: 'View project',
          clientLinks: clientProject.clientLinks,
          is_published: true,
        },
      ]
    : []),
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
  blogTitle: 'Lessons from the work.',
  blogDescription:
    'Practical notes on Adobe Commerce, integration architecture, performance, and AI-assisted engineering.',
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
  posts: [],
  site: seedSite,
}

export const fallbackContent = {
  profile: seedProfile,
  projects: seedProjects,
  certifications: seedCertifications,
  experience: seedExperience,
  education: seedEducation,
  posts: [],
  site: seedSite,
}
