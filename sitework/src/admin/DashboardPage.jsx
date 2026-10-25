import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FileText,
  FolderKanban,
  Inbox,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Link } from '../lib/RouterLink'
import { useAdminContent } from '../contexts/hooks'
import { fetchContactMessages } from '../lib/content'
import { formatDate, isPostPublic, readingTime } from '../lib/format'
import { toPlainText } from '../lib/sanitize'
import { AdminLayout } from './AdminLayout'

function StatCard({ label, value, hint, icon: Icon, to }) {
  const body = (
    <>
      <span className="stat-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </>
  )

  if (to) {
    return (
      <Link className="admin-stat" to={to}>
        {body}
      </Link>
    )
  }
  return <article className="admin-stat">{body}</article>
}

export default function DashboardPage() {
  const { projects, certifications, experience, education, posts, site, themePublished, status } = useAdminContent()
  const [messages, setMessages] = useState({ status: 'loading', rows: [] })

  useEffect(() => {
    let active = true
    fetchContactMessages()
      .then((rows) => active && setMessages({ status: 'ready', rows }))
      .catch((error) => active && setMessages({ status: 'error', rows: [], error }))
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const published = posts.filter((post) => isPostPublic(post)).length
    const drafts = posts.filter((post) => post.status !== 'published').length
    const scheduled = posts.filter(
      (post) => post.status === 'published' && post.published_at && !isPostPublic(post),
    ).length
    const unread = messages.rows.filter((row) => !row.is_read).length
    return { published, drafts, scheduled, unread }
  }, [posts, messages.rows])

  const recentPosts = useMemo(
    () =>
      [...posts]
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
        .slice(0, 5),
    [posts],
  )

  const recentMessages = messages.rows.slice(0, 4)

  const counts = {
    projects: projects.length,
    experience: experience.length,
    certifications: certifications.length,
    education: education.length,
    posts: posts.length,
  }

  return (
    <AdminLayout
      title="Overview"
      eyebrow="DASHBOARD"
      counts={counts}
      actions={
        <>
          <Link className="button button-secondary button-sm" to="/mdadmin/articles/new">
            <Plus size={15} aria-hidden="true" /> New article
          </Link>
          <Link className="button button-primary button-sm" to="/mdadmin/projects/new">
            <Plus size={15} aria-hidden="true" /> New project
          </Link>
        </>
      }
    >
      {status === 'error' ? null : null}

      <section className="admin-welcome">
        <div>
          <p className="eyebrow">YOUR PROFESSIONAL PRESENCE</p>
          <h2>
            Everything on the site,
            <br />
            <em>editable from here.</em>
          </h2>
          <p>
            Changes are saved to the shared portfolio JSON in your GitHub repository. Once the commit is deployed, all visitors and devices see the same published content.
          </p>
          <div className="admin-welcome-actions">
            <Link className="button button-primary" to="/mdadmin/theme">
              Open theme editor
            </Link>
            <Link className="button button-secondary" to="/mdadmin/content">
              Edit page copy
            </Link>
          </div>
        </div>
        <div className="admin-welcome-art" aria-hidden="true">
          <Sparkles size={40} />
          <span>
            YOUR WORK.
            <br />
            YOUR STORY.
          </span>
        </div>
      </section>

      <div className="admin-stat-grid">
        <StatCard label="Published articles" value={stats.published} hint="Visible on the public site" icon={BookOpen} to="/mdadmin/articles" />
        <StatCard label="Drafts" value={stats.drafts} hint="Private until published" icon={FileText} to="/mdadmin/articles" />
        <StatCard label="Projects" value={projects.length} hint="Portfolio case cards" icon={FolderKanban} to="/mdadmin/projects" />
        <StatCard
          label="Unread messages"
          value={messages.status === 'ready' ? stats.unread : '—'}
          hint={messages.status === 'error' ? 'Inbox unavailable' : 'Contact form submissions'}
          icon={Inbox}
          to="/mdadmin/messages"
        />
      </div>

      <div className="admin-bottom-grid">
        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h2>Recently updated</h2>
            </div>
            <Link className="subtle-button" to="/mdadmin/articles">
              All articles <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {recentPosts.length ? (
            <ul className="activity-list">
              {recentPosts.map((post) => {
                const live = isPostPublic(post)
                return (
                  <li key={post.id}>
                    <span className={`activity-status ${live ? 'live' : post.status}`} aria-hidden="true">
                      {live ? <CheckCircle2 size={14} /> : post.status === 'published' ? <Clock size={14} /> : <Circle size={14} />}
                    </span>
                    <div>
                      <Link to={`/mdadmin/articles/${post.id}`}>{post.title}</Link>
                      <small>
                        {live
                          ? `Published ${formatDate(post.published_at)}`
                          : post.status === 'published'
                            ? `Scheduled for ${formatDate(post.published_at)}`
                            : 'Draft'}
                        {` · ${readingTime(post.content)} min read`}
                        {post.excerpt ? ` · ${toPlainText(post.excerpt).slice(0, 70)}` : ''}
                      </small>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="records-empty">
              <BookOpen size={22} aria-hidden="true" />
              <p>No articles yet. Your first one starts with a title.</p>
              <Link className="button button-secondary button-sm" to="/mdadmin/articles/new">
                Write an article
              </Link>
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">INBOX</p>
              <h2>Latest messages</h2>
            </div>
            <Link className="subtle-button" to="/mdadmin/messages">
              <Eye size={14} aria-hidden="true" /> Open
            </Link>
          </div>

          {messages.status === 'loading' ? (
            <p className="admin-muted">Loading messages…</p>
          ) : messages.status === 'error' ? (
            <p className="admin-muted">The inbox could not be read. Check the contact_messages table and its policies.</p>
          ) : recentMessages.length ? (
            <ul className="message-list compact">
              {recentMessages.map((message) => (
                <li key={message.id} className={message.is_read ? '' : 'unread'}>
                  <div>
                    <strong>{message.name}</strong>
                    <small>{formatDate(message.created_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                  <p>{message.message.slice(0, 90)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="records-empty">
              <Inbox size={22} aria-hidden="true" />
              <p>No messages yet.</p>
            </div>
          )}
        </section>
      </div>

      <div className="admin-bottom-grid">
        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">QUICK ACTIONS</p>
              <h2>What would you like to update?</h2>
            </div>
          </div>
          <div className="admin-quick-grid">
            <Link to="/mdadmin/profile">
              <FileText size={16} aria-hidden="true" /> Edit profile <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link to="/mdadmin/experience/new">
              <Plus size={16} aria-hidden="true" /> Add experience <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link to="/mdadmin/certifications/new">
              <Plus size={16} aria-hidden="true" /> Add certification <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link to="/mdadmin/theme">
              <Sparkles size={16} aria-hidden="true" /> Customise theme <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">PUBLISHED THEME</p>
              <h2>Live appearance</h2>
            </div>
            <Link className="subtle-button" to="/mdadmin/theme">
              Edit
            </Link>
          </div>
          <div className="theme-summary">
            <div className="theme-swatches" aria-hidden="true">
              {['bg', 'surface', 'primary', 'accent', 'text'].map((key) => (
                <span key={key} style={{ background: themePublished[themePublished.mode === 'dark' ? 'dark' : 'light']?.[key] }} />
              ))}
            </div>
            <dl>
              <div>
                <dt>Mode</dt>
                <dd>{themePublished.mode}</dd>
              </div>
              <div>
                <dt>Typeface</dt>
                <dd>{themePublished.fontFamily}</dd>
              </div>
              <div>
                <dt>Corner radius</dt>
                <dd>{themePublished.radius}px</dd>
              </div>
              <div>
                <dt>Site title</dt>
                <dd>{site.siteTitle}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
