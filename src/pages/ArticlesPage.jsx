import { useMemo, useState } from 'react'
import { ArrowUpRight, BookOpen, CircleX, Grid2X2, List, Search, SlidersHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { formatDate, isArticlePublic, readingTime, sortArticles, truncate } from '../lib/format'
import { toPlainText } from '../lib/sanitize'
import { useSeo } from '../lib/useSeo'
import { articleHasUploadedCover } from '../lib/articleImages'
import { resolveArticlesPageBannerImage } from '../lib/articleBanner'
import ArticleCoverMedia from '../components/ArticleCoverMedia'

const PAGE_SIZE = 8
export default function ArticlesPage() {
  const { articles: sourceArticles = [], site, status = 'ready', error, reload } = useContent()
  const articles = useMemo(() => sortArticles(sourceArticles.filter((article) => isArticlePublic(article))), [sourceArticles])
  const [view, setView] = useState('grid')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const matched = articles.filter((article) => !needle || [article.title, article.excerpt, article.content, article.category, article.author, ...(article.tags || [])].join(' ').replace(/<[^>]*>/g, ' ').toLocaleLowerCase().includes(needle))
    return matched.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.published_at || a.created_at || 0) - new Date(b.published_at || b.created_at || 0)
      if (sort === 'az') return String(a.title).localeCompare(String(b.title))
      if (sort === 'za') return String(b.title).localeCompare(String(a.title))
      return new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0)
    })
  }, [articles, query, sort])
  const shown = filtered.slice(0, visibleCount)
  const hasSearchQuery = Boolean(query.trim())

  const clearSearch = () => {
    setQuery('')
    setVisibleCount(PAGE_SIZE)
  }

  const bannerImage = resolveArticlesPageBannerImage(site.copy)

  useSeo({ title: `All articles — ${site.siteTitle}`, description: site.copy?.articlesPageDescription || site.copy?.articlesDescription || 'Practical notes on Adobe Commerce, integration architecture, performance, and AI-assisted engineering.', canonicalPath: '/articles' })
  return <main className="section-wrap all-articles-page" id="all-articles">
    <motion.div
      className="articles-page-image-banner is-animated"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="articles-page-image-banner-media">
        <img src={bannerImage} alt="Mahesh Dave — technical articles on ecommerce and system architecture" decoding="async" />
      </div>
      <span className="articles-page-image-banner-shimmer" aria-hidden="true" />
      <span className="articles-page-image-banner-glow" aria-hidden="true" />
    </motion.div>
    <div className="articles-toolbar">
      <div className="articles-search">
        <Search size={18} className="articles-search-icon" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
          placeholder="Search titles, content, tags…"
          aria-label="Search all article content"
        />
        {hasSearchQuery ? (
          <button
            type="button"
            className="articles-search-clear"
            onClick={clearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            <CircleX size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <label className="articles-sort"><SlidersHorizontal size={16}/><span className="sr-only">Sort articles</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">Title A–Z</option><option value="za">Title Z–A</option></select></label>
      <div className="articles-view-controls" role="group" aria-label="Article layout">
        <button type="button" className={view === 'grid' ? 'active' : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Grid view" title="Grid view"><Grid2X2 size={18}/></button>
        <button type="button" className={view === 'list' ? 'active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="List view" title="List view"><List size={19}/></button>
      </div>
    </div>
    {status === 'loading' ? <div className="articles-no-results" role="status">Loading published articles…</div> : status === 'error' ? <div className="articles-no-results" role="alert"><h2>Articles could not be loaded</h2><p>{error || 'The published article collection is temporarily unavailable.'}</p><button className="button button-secondary" onClick={reload}>Try again</button></div> : shown.length ? <motion.div layout className={`article-list-grid ${view === 'list' ? 'article-list-grid-list' : ''}`}>
      {shown.map((article, index) => (
        <motion.article
          layout={view === 'grid'}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .32, delay: Math.min(index * .035, .22) }}
          className={`article-list-card${view === 'list' ? ' article-list-card-list' : ''}`}
          key={article.id || article.slug}
        >
          <Link className={`article-list-card-media${articleHasUploadedCover(article) ? ' is-uploaded' : ' is-placeholder'}`} to={`/articles/${encodeURIComponent(article.slug)}`}>
            <ArticleCoverMedia
              article={article}
              imgClassName=""
              alt={article.title ? `Cover for ${article.title}` : ''}
              loading="lazy"
            />
          </Link>
          <div className="article-list-card-body">
            <p className="cinema-meta">{article.category || 'ENGINEERING NOTES'}{article.published_at ? ` · ${formatDate(article.published_at)}` : ''} · {readingTime(article.content)} min read</p>
            <h2><Link to={`/articles/${encodeURIComponent(article.slug)}`}>{article.title}</Link></h2>
            <p>{article.excerpt || truncate(toPlainText(article.content), 180)}</p>
            <Link className="cinema-link" to={`/articles/${encodeURIComponent(article.slug)}`}>Read article <ArrowUpRight size={15}/></Link>
          </div>
        </motion.article>
      ))}
    </motion.div> : <div className="articles-no-results"><BookOpen size={24}/><h2>{query ? 'No matching articles' : 'Articles coming soon'}</h2><p>{query ? 'Try another keyword. Search includes the full article text, not only titles.' : 'Articles appear here as soon as they are published from the admin dashboard.'}</p>{query ? <button type="button" className="button button-secondary" onClick={clearSearch}>Clear search</button> : null}</div>}
    {shown.length < filtered.length ? <div className="articles-load-more"><button className="button button-primary" onClick={() => setVisibleCount(n => n + PAGE_SIZE)}>Load more articles <ArrowUpRight size={16}/></button><span>Showing {shown.length} of {filtered.length}</span></div> : filtered.length > 0 ? <p className="articles-results-count">Showing all {filtered.length} articles</p> : null}
  </main>
}
