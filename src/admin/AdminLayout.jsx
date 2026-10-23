import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Search,
  Settings2,
  PanelsTopLeft,
  ShieldCheck,
  UserRound,
  X,
  CloudUpload,
  CheckCircle2,
  Eye,
} from 'lucide-react'
import { useAuth } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { useRouter } from '../lib/routerCore'
import { ADMIN_NAV } from '../lib/navigation'
import { hasStagedContent, publishStagedContent } from '../lib/content'

// Navigation entries are data (paths and labels); icons are presentation and
// live here so the nav model stays serialisable.
const NAV_ICONS = {
  overview: LayoutDashboard,
  profile: UserRound,
  content: FileText,
  structure: PanelsTopLeft,
  projects: FolderKanban,
  experience: BriefcaseBusiness,
  certifications: ShieldCheck,
  education: GraduationCap,
  blog: BookOpen,
  messages: Inbox,
  theme: Palette,
  settings: Settings2,
}

export function AdminLayout({ title, eyebrow, children, actions, counts }) {
  const { signOut, user } = useAuth()
  const { pathname, navigate } = useRouter()
  const [navOpen, setNavOpen] = useState(false)
  const [staged, setStaged] = useState(() => hasStagedContent())
  const [publishing, setPublishing] = useState(false)
  const [publishMessage, setPublishMessage] = useState('')

  useEffect(() => {
    const refresh = () => setStaged(hasStagedContent())
    window.addEventListener('portfolio-staging-updated', refresh)
    return () => window.removeEventListener('portfolio-staging-updated', refresh)
  }, [])

  const handlePreview = () => {
    const previewUrl = `${window.location.origin}${import.meta.env.BASE_URL}?preview=local`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePublish = async () => {
    setPublishing(true); setPublishMessage('')
    try { await publishStagedContent(); setStaged(false); setPublishMessage('Published successfully') }
    catch (error) { setPublishMessage(error?.message || 'Publish failed') }
    finally { setPublishing(false) }
  }

  useEffect(() => {
    if (!navOpen) return undefined
    const onKey = (event) => event.key === 'Escape' && setNavOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/mdadmin/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      {navOpen ? (
        <button type="button" className="admin-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
      ) : null}

      <aside className={`admin-sidebar ${navOpen ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-brand-row">
          <Link className="brand admin-brand" to="/mdadmin">
            <span className="brand-mark" aria-hidden="true">
              MD
            </span>
            <span className="brand-text">
              Studio
              <small>CONTENT &amp; THEME</small>
            </span>
          </Link>
          <button type="button" className="icon-button admin-nav-close" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>

        <div className="admin-workspace">
          <span className="workspace-avatar" aria-hidden="true">
            {(user?.email || 'A')[0].toUpperCase()}
          </span>
          <div>
            <strong>{user?.email || 'Administrator'}</strong>
            <small>Local browser CMS</small>
          </div>
          <span className="local-indicator" aria-hidden="true" title="Signed in" />
        </div>

        <p className="admin-label">WORKSPACE</p>
        <nav aria-label="Dashboard sections">
          {ADMIN_NAV.map((item) => {
            const Icon = NAV_ICONS[item.key] || LayoutDashboard
            const count = item.countKey ? counts?.[item.countKey] : null
            const active = item.path === '/mdadmin' ? pathname === '/mdadmin' : pathname.startsWith(item.path)
            return (
              <Link
                key={item.key}
                to={item.path}
                className={active ? 'active' : ''}
                aria-current={active ? 'page' : undefined}
                onClick={() => setNavOpen(false)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
                {typeof count === 'number' && count > 0 ? <small>{count}</small> : null}
              </Link>
            )
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link className="admin-view-link" to="/" target="_blank" rel="noreferrer">
            View public site <ExternalLink size={14} aria-hidden="true" />
          </Link>
          <button type="button" className="admin-signout" onClick={handleSignOut}>
            <LogOut size={15} aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-top-left">
            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navOpen}
            >
              <Menu size={18} />
            </button>
            <div>
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h1>{title}</h1>
            </div>
          </div>
          <div className="admin-top-actions">
            <span className={`publish-status ${staged ? 'is-dirty' : 'is-clean'}`} role="status">{staged ? 'Unpublished changes' : 'All changes published'}</span>
            <button type="button" className="button button-secondary admin-preview-button" onClick={handlePreview} title="Open the local front-end preview with staged changes; nothing is published"><Eye size={15} aria-hidden="true" /> Preview locally</button>
            <button type="button" className="button button-primary admin-publish-button" onClick={handlePublish} disabled={publishing || !staged} title="Commit staged content to GitHub">{publishing ? <span className="spinner" aria-hidden="true" /> : staged ? <CloudUpload size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}{publishing ? 'Publishing…' : 'Publish'}</button>
            {publishMessage ? <span className="publish-feedback" role="status">{publishMessage}</span> : null}
            {actions}
          </div>
        </header>

        {children}

        <footer className="admin-footer">
          <span>Portfolio Studio</span>
          <span>Changes are stored in this browser. Export a backup before clearing site data.</span>
        </footer>
      </div>
    </div>
  )
}

export function AdminLoading({ label = 'Loading workspace…' }) {
  return (
    <div className="admin-loading" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function AdminError({ error, onRetry }) {
  const permission = error?.permission
  return (
    <div className="admin-error" role="alert">
      <AlertTriangle size={22} aria-hidden="true" />
      <h2>{permission ? 'This account cannot read the workspace' : 'The workspace could not be loaded'}</h2>
      <p>
        {permission
          ? 'The database refused the request. Your account is signed in but does not carry the administrator role claim required by the row-level security policies.'
          : error?.message || 'The request failed. Check your connection and try again.'}
      </p>
      {onRetry ? (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function SearchField({ value, onChange, placeholder = 'Search…' }) {
  return (
    <label className="search-box">
      <Search size={15} aria-hidden="true" />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}
