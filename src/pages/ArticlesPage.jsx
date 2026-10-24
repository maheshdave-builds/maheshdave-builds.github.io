import { useMemo, useState } from 'react'
import { ArrowUpRight, BookOpen, Grid2X2, List, Search, SlidersHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { formatDate, isPostPublic, readingTime, sortPosts, truncate } from '../lib/format'
import { toPlainText } from '../lib/sanitize'
import { useSeo } from '../lib/useSeo'

const PAGE_SIZE = 8
export default function ArticlesPage() {
  const { posts = [], site } = useContent()
  const articles = useMemo(() => sortPosts(posts.filter(isPostPublic)), [posts])
  const [view, setView] = useState('grid')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const matched = articles.filter((post) => !needle || [post.title, post.excerpt, post.content, post.category, post.author, ...(post.tags || [])].join(' ').replace(/<[^>]*>/g, ' ').toLocaleLowerCase().includes(needle))
    return matched.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.published_at || a.created_at || 0) - new Date(b.published_at || b.created_at || 0)
      if (sort === 'az') return String(a.title).localeCompare(String(b.title))
      if (sort === 'za') return String(b.title).localeCompare(String(a.title))
      return new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0)
    })
  }, [articles, query, sort])
  const shown = filtered.slice(0, visibleCount)
  useSeo({ title: `All articles — ${site.siteTitle}`, description: 'Practical notes on Adobe Commerce, integration architecture, performance, and AI-assisted engineering.', canonicalPath: '/articles' })
  return <main className="section-wrap all-articles-page" id="all-articles">
    {site.copy?.articlesPageBannerImage ? <motion.div className="articles-page-image-banner" initial={{ opacity: 0, scale: .985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .5 }}><img src={site.copy.articlesPageBannerImage} alt="Article listing banner"/><span className="articles-banner-count"><BookOpen size={16} /> {articles.length} published {articles.length === 1 ? 'article' : 'articles'}</span></motion.div> : <motion.header className="articles-page-banner" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
      <p className="eyebrow">ARTICLES &amp; IDEAS</p><h1>{site.copy?.articlesPageTitle || 'Articles from the work.'}</h1><p>{site.copy?.articlesPageDescription || 'Practical notes on Adobe Commerce, integration architecture, performance, and AI-assisted engineering.'}</p>
      <span className="articles-banner-count"><BookOpen size={16} /> {articles.length} published {articles.length === 1 ? 'article' : 'articles'}</span>
    </motion.header>}
    <div className="articles-toolbar">
      <label className="articles-search"><Search size={18} aria-hidden="true"/><input value={query} onChange={e => {setQuery(e.target.value); setVisibleCount(PAGE_SIZE)}} placeholder="Search titles, content, tags…" aria-label="Search all article content"/></label>
      <label className="articles-sort"><SlidersHorizontal size={16}/><span className="sr-only">Sort articles</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">Title A–Z</option><option value="za">Title Z–A</option></select></label>
      <div className="articles-view-controls" role="group" aria-label="Article layout">
        <button type="button" className={view === 'grid' ? 'active' : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Grid view" title="Grid view"><Grid2X2 size={18}/></button>
        <button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="List view" title="List view"><List size={19}/></button>
      </div>
    </div>
    {shown.length ? <motion.div layout className={`article-list-grid ${view === 'list' ? 'article-list-grid-list' : ''}`}>
      {shown.map((post, index) => <motion.article layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, delay: Math.min(index * .035, .22) }} className="article-list-card" key={post.id || post.slug}>
        {post.cover_image_url ? <Link to={`/blog/${encodeURIComponent(post.slug)}`}><img src={post.cover_image_url} alt={post.title ? `Cover for ${post.title}` : ''} loading="lazy" /></Link> : <Link className="article-card-placeholder" to={`/blog/${encodeURIComponent(post.slug)}`}><BookOpen size={28}/></Link>}
        <div><p className="cinema-meta">{post.category || 'ENGINEERING NOTES'}{post.published_at ? ` · ${formatDate(post.published_at)}` : ''} · {readingTime(post.content)} min read</p>
        <h2><Link to={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</Link></h2><p>{post.excerpt || truncate(toPlainText(post.content), 180)}</p>
        <Link className="cinema-link" to={`/blog/${encodeURIComponent(post.slug)}`}>Read article <ArrowUpRight size={15}/></Link></div>
      </motion.article>)}
    </motion.div> : <div className="articles-no-results"><BookOpen size={24}/><h2>{query ? 'No matching articles' : 'Articles coming soon'}</h2><p>{query ? 'Try another keyword. Search includes the full article text, not only titles.' : 'Articles appear here as soon as they are published from the admin dashboard.'}</p>{query ? <button className="button button-secondary" onClick={() => setQuery('')}>Clear search</button> : null}</div>}
    {shown.length < filtered.length ? <div className="articles-load-more"><button className="button button-primary" onClick={() => setVisibleCount(n => n + PAGE_SIZE)}>Load more articles <ArrowUpRight size={16}/></button><span>Showing {shown.length} of {filtered.length}</span></div> : filtered.length > 0 ? <p className="articles-results-count">Showing all {filtered.length} articles</p> : null}
  </main>
}
