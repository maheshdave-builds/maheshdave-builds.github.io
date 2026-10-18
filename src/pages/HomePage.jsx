import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Download,
  ExternalLink,
  Github,
  GraduationCap,
  Linkedin,
  Layers3,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { useContent } from '../contexts/hooks'
import { Button, TextLink } from '../components/Button'
import Reveal from '../components/Reveal'
import { Link } from '../lib/RouterLink'
import { useSeo, SITE_ORIGIN } from '../lib/useSeo'
import { formatDate, isPostPublic, readingTime, truncate } from '../lib/format'
import { toPlainText } from '../lib/sanitize'

function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <Reveal as="div" className="section-title">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </Reveal>
  )
}

/* ------------------------------------------------------------------- hero */

function Hero({ profile, copy, onSection }) {
  return (
    <section id="home" className="hero section-wrap" aria-labelledby="hero-title">
      <div className="hero-orbit orbit-one" aria-hidden="true" />
      <div className="hero-orbit orbit-two" aria-hidden="true" />

      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          {copy.heroEyebrow}
        </p>
        <h1 id="hero-title">
          <span className="hero-name">{profile.shortName || profile.name}</span>
          <em>{copy.heroHeadline}</em>
        </h1>
        <p className="hero-intro">{profile.intro}</p>

        <div className="hero-actions">
          <Button to="/#projects" variant="primary" icon={ArrowDownRight}>
            Explore projects
          </Button>
          <Button to="/#contact" variant="secondary" icon={ArrowUpRight}>
            Let&rsquo;s connect
          </Button>
          <a className="resume-link" href={profile.resumeUrl} target="_blank" rel="noreferrer">
            <Download size={15} aria-hidden="true" /> Resume PDF
          </a>
        </div>

        <div className="hero-meta">
          <span>
            <MapPin size={13} aria-hidden="true" /> {profile.location}
          </span>
          <span>9+ years in commerce engineering</span>
          {profile.availability ? <span className="hero-availability">{profile.availability}</span> : null}
        </div>
      </div>

      <div className="portrait-stage">
        <div className="portrait-backdrop" aria-hidden="true" />
        <figure className="portrait-frame">
          <img
            src={profile.profileImage || '/profile.jpg'}
            alt={`Portrait of ${profile.name}`}
            width="350"
            height="420"
            decoding="async"
            fetchPriority="high"
            onError={(event) => {
              // The seed used to point at a deleted file; fall back once, then stop
              // so a missing image cannot loop forever.
              if (!event.currentTarget.dataset.fallback) {
                event.currentTarget.dataset.fallback = 'true'
                event.currentTarget.src = '/profile.jpg'
              }
            }}
          />
        </figure>
        <figcaption className="portrait-caption">
          <span className="caption-dot" aria-hidden="true" />
          <div>
            <strong>{profile.shortName || profile.name}</strong>
            <small>{profile.title}</small>
          </div>
          <span className="caption-number">01 / MD</span>
        </figcaption>
        <div className="floating-stamp" aria-hidden="true">
          <Award size={17} />
          <span>
            Adobe Commerce
            <br />
            <b>Certified</b>
          </span>
        </div>
      </div>

      <button type="button" className="scroll-cue" onClick={() => onSection('about')}>
        <span>SCROLL TO EXPLORE</span>
        <span className="scroll-line" aria-hidden="true" />
      </button>
    </section>
  )
}

/* ------------------------------------------------------------------ about */

function About({ profile, copy, stats }) {
  return (
    <section id="about" className="section-wrap about-section" aria-labelledby="about-title">
      <SectionHeading
        eyebrow="01 — THE APPROACH"
        id="about-title"
        title={copy.aboutTitle}
        description={copy.aboutDescription}
      />
      <div className="about-grid">
        <Reveal className="about-lead">
          <span className="large-quote" aria-hidden="true">
            &ldquo;
          </span>
          <p>
            {profile.about?.bio} {profile.about?.focus}
          </p>
          <p className="muted-copy">{profile.about?.summary}</p>
          <TextLink to="/#experience">Explore my experience</TextLink>
        </Reveal>

        <div className="stat-grid">
          {stats.map((stat, index) => (
            <Reveal
              as="article"
              className="stat-card"
              key={`${stat.label}-${index}`}
              delay={index * 70}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- projects */

function ProjectCard({ project, index }) {
  const initials = (project.title || 'M')
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
  const hasLinks = (project.clientLinks || []).length > 0

  return (
    <Reveal as="article" className="project-card" delay={(index % 3) * 70}>
      <div className="project-art">
        {project.image || project.clientLogo ? (
          <img
            className="project-logo-image"
            src={project.image || project.clientLogo}
            alt={`${project.title} logo`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="project-art-mark" aria-hidden="true">
            {initials}
          </span>
        )}
        <span className="project-art-number" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="project-category">{project.category || 'Commerce project'}</span>
      </div>

      <div className="project-card-body">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="tag-row">
          {(project.techStack || []).slice(0, 5).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="project-card-footer">
          {project.url ? (
            <a href={project.url} target="_blank" rel="noreferrer">
              {project.linkLabel || 'View project'} <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ) : (
            <span className="private-label">Project details available on request</span>
          )}

          {hasLinks ? (
            <details className="client-links">
              <summary>
                {project.clientLinks.length} client sites <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div>
                {project.clientLinks.map((client) => (
                  <a key={client.url} href={client.url} target="_blank" rel="noreferrer">
                    {client.name} <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </Reveal>
  )
}

function Projects({ projects, copy, showClientProjects }) {
  const [filter, setFilter] = useState('All')

  const categories = ['All', ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))]
  const visible = projects
    .filter((project) => showClientProjects || project.category !== 'Client implementations')
    .filter((project) => filter === 'All' || project.category === filter)

  return (
    <section id="projects" className="section-wrap projects-section" aria-labelledby="projects-title">
      <SectionHeading
        eyebrow="03 — PROJECTS & CLIENTS"
        id="projects-title"
        title={copy.projectsTitle}
        description={copy.projectsDescription}
      />

      {categories.length > 2 ? (
        <div className="project-filters" role="group" aria-label="Filter projects by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={filter === category ? 'is-active' : ''}
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
          <span className="project-count">
            {visible.length} {visible.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      ) : null}

      {visible.length ? (
        <div className="project-grid">
          {visible.map((project, index) => (
            <ProjectCard project={project} index={index} key={project.id || project.title} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Layers3 size={22} aria-hidden="true" />
          <p>No projects are published in this category yet.</p>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------- experience */

function Experience({ items, copy }) {
  return (
    <section id="experience" className="section-wrap experience-section" aria-labelledby="experience-title">
      <SectionHeading
        eyebrow="02 — CAREER"
        id="experience-title"
        title={copy.experienceTitle}
        description={copy.experienceDescription}
      />

      {items.length ? (
        <ol className="timeline">
          {items.map((item, index) => (
            <Reveal as="li" className="timeline-item" key={item.id || `${item.company}-${item.role}`} delay={index * 55}>
              <div className="timeline-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="timeline-content">
                <div className="timeline-heading">
                  <div>
                    <h3>{item.role}</h3>
                    <p>{item.company}</p>
                  </div>
                  <span>{item.duration}</span>
                </div>
                {item.description ? <p className="timeline-description">{item.description}</p> : null}
              </div>
            </Reveal>
          ))}
        </ol>
      ) : (
        <div className="empty-state">
          <BriefcaseBusiness size={22} aria-hidden="true" />
          <p>Experience entries have not been published yet.</p>
        </div>
      )}
    </section>
  )
}

/* ---------------------------------------------------------- certifications */

function Certifications({ items, copy }) {
  return (
    <section id="certifications" className="section-wrap certifications-section" aria-labelledby="certifications-title">
      <SectionHeading
        eyebrow="04 — CREDENTIALS"
        id="certifications-title"
        title={copy.certificationsTitle}
        description={copy.certificationsDescription}
      />

      <div className="cert-grid">
        {items.map((cert, index) => (
          <Reveal
            as="article"
            className="cert-card"
            key={cert.id || cert.name}
            delay={(index % 3) * 60}
          >
            <span className="cert-icon" aria-hidden="true">
              {cert.image ? <img src={cert.image} alt="" loading="lazy" /> : <Award size={20} />}
            </span>
            <span className="cert-index">CREDENTIAL / {String(index + 1).padStart(2, '0')}</span>
            <h3>{cert.name}</h3>
            <p>
              {cert.issuer || 'Adobe'}
              {cert.year ? ` · ${cert.year}` : ''}
            </p>
            {cert.verificationUrl ? (
              <TextLink href={cert.verificationUrl} className="cert-verify">
                Verify credential
              </TextLink>
            ) : null}
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- education */

function Education({ items, copy }) {
  return (
    <section id="education" className="section-wrap education-section" aria-labelledby="education-title">
      <SectionHeading
        eyebrow="05 — EDUCATION"
        id="education-title"
        title={copy.educationTitle}
        description={copy.educationDescription}
      />

      <div className="education-grid">
        {items.map((item, index) => (
          <Reveal as="article" className="education-card" key={item.id || item.degree} delay={index * 65}>
            <span className="education-icon" aria-hidden="true">
              <GraduationCap size={20} />
            </span>
            <span className="education-year">{item.year}</span>
            <h3>{item.degree}</h3>
            <p>{item.school}</p>
            <small>{item.detail}</small>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- toolkit */

function Toolkit({ groups, copy }) {
  return (
    <section id="expertise" className="section-wrap stack-section" aria-labelledby="toolkit-title">
      <SectionHeading
        eyebrow="06 — TOOLKIT"
        id="toolkit-title"
        title={copy.toolkitTitle}
        description={copy.toolkitDescription}
      />

      <div className="stack-grid">
        {groups.map((group, index) => (
          <Reveal as="article" className="stack-card" key={group.category} delay={(index % 3) * 55}>
            <h3>{group.category}</h3>
            <div className="tag-row">
              {group.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- blog */

function Blog({ posts, copy }) {
  const published = posts.filter((post) => isPostPublic(post)).slice(0, 3)

  return (
    <section id="blog" className="section-wrap blog-section" aria-labelledby="blog-title">
      <SectionHeading eyebrow="07 — NOTES & IDEAS" id="blog-title" title={copy.blogTitle} description={copy.blogDescription} />

      {published.length ? (
        <div className="blog-grid">
          {published.map((post, index) => (
            <Reveal as="article" className="blog-card" key={post.id || post.slug} delay={index * 65}>
              {post.cover_image_url ? (
                <img
                  className="blog-cover"
                  src={post.cover_image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="640"
                  height="360"
                />
              ) : null}
              <p className="eyebrow">
                {post.category || 'ENGINEERING NOTES'}
                {post.published_at ? ` · ${formatDate(post.published_at)}` : ''}
              </p>
              <h3>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p>{post.excerpt || truncate(toPlainText(post.content), 160)}</p>
              <div className="blog-card-meta">
                <span>{readingTime(post.content)} min read</span>
                <TextLink to={`/blog/${post.slug}`}>Read article</TextLink>
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="blog-empty-state">
          <BookOpen size={22} aria-hidden="true" />
          <div>
            <h3>Notes coming soon</h3>
            <p>Articles appear here as soon as they are published from the admin dashboard.</p>
          </div>
        </div>
      )}
    </section>
  )
}

/* ----------------------------------------------------------------- contact */

function Contact({ profile, copy, site }) {
  return (
    <section id="contact" className="section-wrap contact-section" aria-labelledby="contact-title">
      <div className="contact-panel">
        <div>
          <p className="eyebrow">08 — START A CONVERSATION</p>
          <h2 id="contact-title">{copy.contactTitle}</h2>
          <p className="contact-copy">{copy.contactDescription}</p>
        </div>

        <div className="contact-actions">
          <Button href={`mailto:${site?.contactEmail || profile.email}`} variant="light" icon={Mail}>
            Email {profile.shortName?.split(' ')[0] || 'me'}
          </Button>
          <p>{site?.contactEmail || profile.email}</p>
          <div className="social-row">
            {profile.social_urls?.linkedin ? (
              <a href={profile.social_urls.linkedin} target="_blank" rel="noreferrer">
                <Linkedin size={14} aria-hidden="true" /> LinkedIn <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ) : null}
            {profile.social_urls?.github ? (
              <a href={profile.social_urls.github} target="_blank" rel="noreferrer">
                <Github size={14} aria-hidden="true" /> GitHub <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ) : null}
            {profile.social_urls?.stackexchange ? (
              <a href={profile.social_urls.stackexchange} target="_blank" rel="noreferrer">
                Stack Exchange <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <small>
            <Sparkles size={12} aria-hidden="true" /> Usually replies within two business days.
          </small>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- page */

export default function HomePage({ onSection }) {
  const { profile, projects, certifications, experience, education, site, posts } = useContent()
  const copy = site.copy

  useSeo({
    title: site.siteTitle,
    description: site.siteDescription,
    canonicalPath: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.title,
      email: `mailto:${profile.email}`,
      address: { '@type': 'PostalAddress', addressLocality: profile.location },
      url: SITE_ORIGIN,
      sameAs: Object.values(profile.social_urls || {}).filter(Boolean),
      knowsAbout: site.techStack?.flatMap((group) => group.items?.slice(0, 4) || []).slice(0, 20),
    },
    jsonLdId: 'person-jsonld',
  })

  return (
    <main id="main">
      <Hero profile={profile} copy={copy} stats={site.stats} onSection={onSection} />
      <About profile={profile} copy={copy} stats={site.stats} />
      <Projects projects={projects} copy={copy} showClientProjects={site.showClientProjects} />
      <Experience items={experience} copy={copy} />
      <Certifications items={certifications} copy={copy} />
      <Education items={education} copy={copy} />
      <Toolkit groups={site.techStack} copy={copy} />
      <Blog posts={posts} copy={copy} />
      <Contact profile={profile} copy={copy} site={site} />
    </main>
  )
}

