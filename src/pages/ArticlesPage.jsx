import { useMemo, useState } from 'react'
import { ArrowUpRight, BookOpen, Grid2X2, List } from 'lucide-react'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { formatDate, isPostPublic, readingTime, sortPosts, truncate } from '../lib/format'
import { toPlainText } from '../lib/sanitize'
import { useSeo } from '../lib/useSeo'

export default function ArticlesPage() {
  const { posts, site } = useContent()
  const articles = useMemo(() => sortPosts(posts.filter(isPostPublic)), [posts])
  const [view, setView] = useState('grid')
  useSeo({ title: `All articles — ${site.siteTitle}`, description: 'All published articles and engineering notes.', canonicalPath: '/articles' })
  return <main className="section-wrap all-articles-page" id="all-articles">
    <div className="section-heading"><p className="eyebrow">ARTICLES & IDEAS</p><h1>All articles</h1><p>Engineering notes, tutorials, and ideas.</p></div>
    {articles.length ? <>
    <div className="articles-view-controls" role="group" aria-label="Article layout">
      <button type="button" className={view === 'grid' ? 'active' : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={16}/> Grid view</button>
      <button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16}/> List view</button>
    </div>
    <div className={`article-list-grid ${view === 'list' ? 'article-list-grid-list' : ''}`}>{articles.map(post => <article className="article-list-card" key={post.id || post.slug}>
      {post.cover_image_url ? <Link to={`/blog/${post.slug}`}><img src={post.cover_image_url} alt="" loading="lazy" /></Link> : null}
      <div><p className="cinema-meta">{post.category || 'ENGINEERING NOTES'}{post.published_at ? ` · ${formatDate(post.published_at)}` : ''} · {readingTime(post.content)} min read</p>
      <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt || truncate(toPlainText(post.content), 180)}</p>
      <Link className="cinema-link" to={`/blog/${post.slug}`}>Read article <ArrowUpRight size={15}/></Link></div>
    </article>)}</div>
    </> : <p><BookOpen size={18}/> No published articles yet.</p>}
  </main>
}
