import { useEffect, useState } from 'react'
import { ArrowUpRight, Linkedin, Menu, Github, Sun, Moon, X, Mail } from 'lucide-react'
import { useTheme } from '../contexts/hooks'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { Button } from './Button'
import { NAV_ITEMS } from '../lib/navigation'

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Toolkit', href: '#expertise' },
  { label: 'Education', href: '#education' },
  { label: 'Notes', href: '#blog' },
  { label: 'Contact', href: '#contact' },
]

export default function SiteHeader({ activeSection }) {
  const { mode, toggle } = useTheme()
  const { site, profile } = useContent()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on Escape and lock body scroll while it is open, so a
  // long menu cannot be scrolled past its own backdrop on a phone.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)
  const socials = profile.social_urls || {}

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <Link className="brand" to="/#home" onClick={close}>
        {site?.siteLogo ? (
          <img className="brand-image" src={site.siteLogo} alt="" width="44" height="44" />
        ) : (
          <span className="brand-mark" aria-hidden="true">
            MD
          </span>
        )}
        <span className="brand-text">
          {profile.shortName || profile.name}
          <small>{profile.title?.split('·')[0]?.trim() || 'Adobe Commerce'}</small>
        </span>
      </Link>

      <nav className={`main-nav ${open ? 'open' : ''}`} aria-label="Primary">
        {NAV_LINKS.map((item) => (
          <Link
            key={item.href}
            to={`/${item.href}`}
            className={activeSection === item.href.slice(1) ? 'is-active' : ''}
            onClick={close}
            aria-current={activeSection === item.href.slice(1) ? 'true' : undefined}
          >
            {item.label}
          </Link>
        ))}
        <div className="mobile-nav-footer">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <div className="mobile-nav-socials">
            {socials.linkedin ? (
              <a href={socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <Linkedin size={16} />
              </a>
            ) : null}
            {socials.github ? (
              <a href={socials.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github size={16} />
              </a>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggle}
          aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
        >
          {mode === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </button>
        <Button to="/#contact" variant="primary" size="sm" icon={ArrowUpRight} className="header-cta">
          Let&rsquo;s talk
        </Button>
        <button
          type="button"
          className="mobile-toggle"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const { profile, site } = useContent()
  const socials = profile.social_urls || {}
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Link className="brand" to="/#home">
            <span className="brand-mark" aria-hidden="true">
              MD
            </span>
            <span className="brand-text">
              {profile.shortName || profile.name}
              <small>Adobe Commerce engineering</small>
            </span>
          </Link>
          <p>{profile.footerNote || 'Building dependable commerce experiences with clarity and care.'}</p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          <div>
            <h2>Explore</h2>
            <Link to="/#projects">Projects</Link>
            <Link to="/#experience">Experience</Link>
            <Link to="/#certifications">Certifications</Link>
            <Link to="/#blog">Notes</Link>
          </div>
          <div>
            <h2>Elsewhere</h2>
            {socials.linkedin ? (
              <a href={socials.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            ) : null}
            {socials.github ? (
              <a href={socials.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            ) : null}
            {socials.stackexchange ? (
              <a href={socials.stackexchange} target="_blank" rel="noreferrer">
                Magento Stack Exchange
              </a>
            ) : null}
            <a href={profile.resumeUrl || '/Mahesh_Dave_Resume_2026.pdf'} target="_blank" rel="noreferrer">
              Resume (PDF)
            </a>
          </div>
        </nav>
      </div>

      <div className="site-footer-meta">
        <p>
          © {year} {profile.name}. All rights reserved.
        </p>
        <div>
          <a href={`mailto:${site?.contactEmail || profile.email}`}>
            <Mail size={13} aria-hidden="true" /> {site?.contactEmail || profile.email}
          </a>
          <Link to="/#home">Back to top ↑</Link>
          <Link to="/admin" className="footer-admin">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
