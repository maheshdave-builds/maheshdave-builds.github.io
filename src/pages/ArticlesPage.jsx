import { useMemo } from 'react'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { formatDate, isPostPublic, readingTime, sortPosts, truncate } from '../lib/format'
import { toPlainText } from '../lib/sanitize'
import { useSeo } from '../lib/useSeo'

export default function ArticlesPage() {
  const { posts, site } = useContent()
  const articles = useMemo(() => sortPosts(posts.filter(isPostPublic)), [posts])
  useSeo({ title: `All articles — ${site.siteTitle}`, description: 'All published articles and engineering notes.', canonicalPath: '/articles' })
  return <main className="section-wrap all-articles-page" id="all-articles">
    <div className="section-heading"><p className="eyebrow">ARTICLES & IDEAS</p><h1>All articles</h1><p>Engineering notes, tutorials, and ideas.</p></div>
    {articles.length ? <div className="article-list-grid">{articles.map(post => <article className="article-list-card" key={post.id || post.slug}>
      {post.cover_image_url ? <Link to={`/blog/${post.slug}`}><img src={post.cover_image_url} alt="" loading="lazy" /></Link> : null}
      <div><p className="cinema-meta">{post.category || 'ENGINEERING NOTES'}{post.published_at ? ` · ${formatDate(post.published_at)}` : ''} · {readingTime(post.content)} min read</p>
      <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt || truncate(toPlainText(post.content), 180)}</p>
      <Link className="cinema-link" to={`/blog/${post.slug}`}>Read article <ArrowUpRight size={15}/></Link></div>
    </article>)}</div> : <p><BookOpen size={18}/> No published articles yet.</p>}
  </main>
}
