import { useEffect, useState } from 'react'
import { ArrowUp, ArrowUpRight, Linkedin, Menu, Github, Sun, Moon, X, Mail } from 'lucide-react'
import { useTheme } from '../contexts/hooks'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { Button } from './Button'
import { NAV_ITEMS } from '../lib/navigation'

const NAV_LINKS = NAV_ITEMS

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
  const navLinks = (Array.isArray(site.navigationLinks) ? site.navigationLinks : NAV_LINKS).filter((item) => item.visible !== false)
  const navTarget = (href) => String(href || '#home').startsWith('http') || String(href || '').startsWith('/') ? href : `/${href}`

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <Link className={`brand brand-style-${site.brandStyle || 'classic'}`} to="/#home" onClick={close}>
        {site?.siteLogo ? (
          <img className="brand-image" src={site.siteLogo} alt="" width="44" height="44" />
        ) : (
          <span className="brand-mark" aria-hidden="true">
            MD
          </span>
        )}
        <span className="brand-text">
          {site.brandName || profile.shortName || profile.name}
          <small>{site.brandTagline || profile.title?.split('·')[0]?.trim() || 'Adobe Commerce'}</small>
        </span>
      </Link>

      <nav className={`main-nav nav-style-${site.menuStyle || 'underline'} ${open ? 'open' : ''}`} aria-label="Primary">
        {navLinks.map((item, index) => {
          const href = item.href || '#home'
          const isExternal = /^https?:\/\//i.test(href)
          const sectionId = href.includes('#') ? href.split('#').pop() : ''
          return isExternal ? <a key={`${item.label}-${index}`} href={href} target="_blank" rel="noreferrer" onClick={close}>{item.label}</a> : (
            <Link key={`${item.label}-${index}`} to={navTarget(href)} className={sectionId && activeSection === sectionId ? 'is-active' : ''} onClick={close} aria-current={sectionId && activeSection === sectionId ? 'true' : undefined}>{item.label}</Link>
          )
        })}
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



export function SiteFavicon() {
  const { site } = useContent()
  useEffect(() => {
    if (typeof document === 'undefined') return
    const logo = String(site?.siteLogo || '').trim()
    const href = logo || `${import.meta.env.BASE_URL}favicon.svg`
    const mimeMatch = href.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)
    const extension = href.split(/[?#]/)[0].match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase()
    const mime = mimeMatch?.[1] || ({ png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', ico: 'image/x-icon', gif: 'image/gif' }[extension] || 'image/jpeg')
    document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]').forEach((node) => node.remove())
    const icon = document.createElement('link')
    icon.rel = 'icon'
    icon.type = mime
    // A version parameter helps bypass stale favicon caches when a logo URL is reused.
    if (logo && !/^data:/i.test(href) && !/^blob:/i.test(href)) {
      try { const url = new URL(href, window.location.href); if (!url.search) url.searchParams.set('favicon_v', String(site?.updatedAt || Date.now())); icon.href = url.href }
      catch { icon.href = href }
    } else icon.href = href
    icon.setAttribute('sizes', 'any')
    document.head.appendChild(icon)
    let touch = document.querySelector('link[rel="apple-touch-icon"]')
    if (!touch) { touch = document.createElement('link'); touch.rel = 'apple-touch-icon'; document.head.appendChild(touch) }
    touch.href = href
  }, [site?.siteLogo, site?.updatedAt])
  return null
}

export function SiteFooter() {
  const { profile, site } = useContent()
  const socials = profile.social_urls || {}
  const year = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <>
    <div className="scroll-to-top-anchor">
      <button type="button" className="scroll-to-top" onClick={scrollToTop} aria-label="Back to top">
        <ArrowUp size={18} aria-hidden="true" />
        <span className="sr-only">Back to top</span>
      </button>
    </div>
    <footer className="site-footer">
      <div className="footer-orb footer-orb-one" aria-hidden="true" />
      <div className="footer-orb footer-orb-two" aria-hidden="true" />
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Link className={`brand brand-style-${site.brandStyle || 'classic'}`} to="/#home">
            {site?.siteLogo ? (
              <img className="brand-image" src={site.siteLogo} alt="" width="48" height="48" />
            ) : (
              <span className="brand-mark" aria-hidden="true">MD</span>
            )}
            <span className="brand-text">
              {site.brandName || profile.shortName || profile.name}
              <small>{site.brandTagline || profile.title?.split('·')[0]?.trim() || 'Adobe Commerce'}</small>
            </span>
          </Link>
          <p>{site.footerText || profile.footerNote || 'Building dependable commerce experiences with clarity and care.'}</p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          <div className="footer-link-group">
            <h2>Explore</h2>
            {(Array.isArray(site.footerLinks) && site.footerLinks.length ? site.footerLinks : (Array.isArray(site.navigationLinks) ? site.navigationLinks : NAV_ITEMS)).filter((item) => item.visible !== false && item.label && item.href).map((item, index) => {
              const href = item.href || '#home'
              return /^https?:\/\//i.test(href)
                ? <a key={`${item.label}-${index}`} href={href} target="_blank" rel="noreferrer">{item.label}</a>
                : <Link key={`${item.label}-${index}`} to={href.startsWith('/') ? href : `/${href}`}>{item.label}</Link>
            })}
          </div>
          <div className="footer-link-group">
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
          © {year} Mahesh Dave. All rights reserved.
        </p>
        <div>
          <a href={`mailto:${site?.contactEmail || profile.email}`}>
            <Mail size={13} aria-hidden="true" /> {site?.contactEmail || profile.email}
          </a>
        </div>
      </div>
    </footer>
    </>
  )
}
