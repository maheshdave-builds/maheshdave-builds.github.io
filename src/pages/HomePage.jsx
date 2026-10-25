import ContentSlider from '../components/ContentSlider'
import CinematicSlider from '../components/CinematicSlider'
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
import { formatDate, isArticlePublic, readingTime, truncate } from '../lib/format'
import { getArticleCoverImage } from '../lib/articleImages'
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
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          {copy.heroEyebrow}
        </p>
        <h1 id="hero-title">
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

      <div className={`portrait-stage portrait-section-${profile.profileImageSectionDesign || 'classic-professional'}`}>
        <div className="portrait-backdrop" aria-hidden="true" />
        <figure className={`portrait-frame portrait-design-${profile.profileImageDesign || 'editorial'}`}>
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
        <figcaption className="portrait-caption" hidden aria-hidden="true">
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
        eyebrow="THE APPROACH"
        id="about-title"
        title={copy.aboutTitle}
        description={copy.aboutDescription}
      />
      <div className="about-grid">
        <Reveal className="about-lead">
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

function Projects({ projects, copy, sliderIntervalSeconds }) {
  return (
    <section id="projects" className="section-wrap projects-section" aria-labelledby="projects-title">
      <SectionHeading eyebrow="PROJECTS & CLIENTS" id="projects-title" title={copy.projectsTitle} description={copy.projectsDescription} />
      {projects.length ? (
        <CinematicSlider intervalSeconds={sliderIntervalSeconds} label="Selected projects" items={projects} imageFit="contain" getTitle={(project) => project.title} getImage={(project) => project.image || project.clientLogo} getLink={(project) => project.url} renderDetails={(project, index, primary) => primary ? <><p className="cinema-summary">{project.description}</p><div className="cinema-tags">{(project.techStack || []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>{project.url ? <a className="cinema-link" href={project.url} target="_blank" rel="noreferrer">View project <ArrowUpRight size={15}/></a> : null}</> : null} />
      ) : <div className="empty-state"><Layers3 size={22} aria-hidden="true" /><p>No projects have been added yet. Add projects from the admin dashboard.</p></div>}
    </section>
  )
}

/* ------------------------------------------------------------- experience */

function Experience({ items, copy }) {
  return (
    <section id="experience" className="section-wrap experience-section" aria-labelledby="experience-title">
      <SectionHeading
        eyebrow="CAREER"
        id="experience-title"
        title={copy.experienceTitle}
        description={copy.experienceDescription}
      />

      {items.length ? (
        <div className="career-journey">
          <div className="career-journey-line" aria-hidden="true"><span /></div>
          {items.map((item, index) => (
            <Reveal as="article" className="career-milestone" key={item.id || `${item.company}-${item.role}`} delay={Math.min(index * 55, 220)} y={10}>
              <div className="career-marker" aria-hidden="true"><BriefcaseBusiness size={15} /></div>
              <div className="career-entry">
                <div className="career-entry-heading">
                  <div className="career-entry-role">
                    <h3>{item.role}</h3>
                    <p className="career-company">{item.company}</p>
                  </div>
                  <span className="career-date">{item.duration || 'Career experience'}</span>
                </div>
                {item.description ? <p className="career-description">{item.description}</p> : null}
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="empty-state"><BriefcaseBusiness size={22} aria-hidden="true" /><p>Experience entries have not been published yet.</p></div>
      )}
    </section>
  )
}

/* ---------------------------------------------------------- certifications */

function Certifications({ items, copy, sliderIntervalSeconds }) {
  return (
    <section id="certifications" className="section-wrap certifications-section" aria-labelledby="certifications-title">
      <SectionHeading
        eyebrow="CREDENTIALS"
        id="certifications-title"
        title={copy.certificationsTitle}
        description={copy.certificationsDescription}
      />

      <CinematicSlider intervalSeconds={sliderIntervalSeconds} label="Certifications" items={items} imageFit="contain" getTitle={(cert) => cert.name} getImage={(cert) => cert.image} getLink={(cert) => cert.verificationUrl} renderDetails={(cert, index, primary) => primary ? <><p className="cinema-summary">{cert.issuer || 'Adobe'}{cert.year ? ` · ${cert.year}` : ''}</p>{cert.verificationUrl ? <a className="cinema-link" href={cert.verificationUrl} target="_blank" rel="noreferrer">Verify credential <ArrowUpRight size={15}/></a> : null}</> : null} />
    </section>
  )
}

/* --------------------------------------------------------------- education */

function Education({ items, copy }) {
  return (
    <section id="education" className="section-wrap education-section" aria-labelledby="education-title">
      <SectionHeading
        eyebrow="EDUCATION"
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
        eyebrow="TOOLKIT"
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

/* ---------------------------------------------------------------- articles */

function Articles({ articles, copy, sliderIntervalSeconds, status, error, reload }) {
  const published = articles.filter((article) => isArticlePublic(article))

  return (
    <section id="articles" className="section-wrap articles-section" aria-labelledby="articles-title">
      <div className="articles-section-heading">
        <SectionHeading eyebrow="ARTICLES & IDEAS" id="articles-title" title={copy.articlesTitle} description={copy.articlesDescription} />
        <Link className="articles-view-all-link" to="/articles">View All Articles <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>

      {status === 'loading' ? (
        <div className="articles-empty-state" role="status"><BookOpen size={22} aria-hidden="true" /><div><h3>Loading articles…</h3><p>Published articles are being loaded.</p></div></div>
      ) : status === 'error' ? (
        <div className="articles-empty-state" role="alert"><BookOpen size={22} aria-hidden="true" /><div><h3>Articles could not be loaded</h3><p>{error || 'The published article collection is temporarily unavailable.'}</p><button className="button button-secondary button-sm" onClick={reload}>Try again</button></div></div>
      ) : published.length ? (
        <CinematicSlider intervalSeconds={sliderIntervalSeconds} label="Articles" items={published} getTitle={(article) => article.title} getImage={getArticleCoverImage} getLink={(article) => `/articles/${encodeURIComponent(article.slug)}`} renderDetails={(article, index, primary) => primary ? <><p className="cinema-summary">{article.excerpt || truncate(toPlainText(article.content), 160)}</p><p className="cinema-meta">{article.category || 'ENGINEERING NOTES'}{article.published_at ? ` · ${formatDate(article.published_at)}` : ''} · {readingTime(article.content)} min read</p><Link className="cinema-link" to={`/articles/${encodeURIComponent(article.slug)}`}>Read article <ArrowUpRight size={15}/></Link></> : null} />
      ) : (
        <div className="articles-empty-state">
          <BookOpen size={22} aria-hidden="true" />
          <div>
            <h3>Articles coming soon</h3>
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
          <p className="eyebrow">START A CONVERSATION</p>
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
  const { profile, projects, certifications, experience, education, site, articles, status, error, reload } = useContent()
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

  const builtInSections = {
    home: <Hero profile={profile} copy={copy} stats={site.stats} onSection={onSection} />,
    about: <About profile={profile} copy={copy} stats={site.stats} />,
    projects: <Projects projects={projects} copy={copy} sliderIntervalSeconds={site.sliderIntervalSeconds ?? 5} />,
    experience: <Experience items={experience} copy={copy} />,
    certifications: <Certifications items={certifications} copy={copy} sliderIntervalSeconds={site.sliderIntervalSeconds ?? 5} />,
    education: <Education items={education} copy={copy} />,
    expertise: <Toolkit groups={site.techStack} copy={copy} />,
    articles: <Articles articles={articles} copy={copy} status={status} error={error} reload={reload} sliderIntervalSeconds={site.sliderIntervalSeconds ?? 5} />,
    contact: <Contact profile={profile} copy={copy} site={site} />,
  }
  const customSections = site.customSections || []
  const customMap = Object.fromEntries(customSections.map((section) => [section.id, section]))
  const defaultOrder = ['home', 'about', 'projects', 'experience', 'certifications', 'education', 'expertise', 'articles', 'contact']
  const order = [...new Set([...(site.structure?.order || defaultOrder), ...defaultOrder, ...customSections.map((section) => section.id)])]
  const hidden = site.structure?.hidden || []

  return (
    <main id="main">
      {order.map((id) => {
        if (hidden.includes(id)) return null
        if (builtInSections[id]) return <div className="ordered-section" key={id}>{builtInSections[id]}</div>
        const section = customMap[id]
        if (!section || section.visible === false) return null
        return <section className="section-wrap custom-public-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
          <SectionHeading eyebrow="ADDITIONAL SECTION" title={section.title || 'More'} id={`${section.id}-title`} />
          <Reveal className="custom-public-content"><p>{section.body}</p></Reveal>
        </section>
      })}
    </main>
  )
}

