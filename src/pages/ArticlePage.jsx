import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, BookOpen, Share2 } from 'lucide-react'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { TextLink } from '../components/Button'
import { absoluteUrl, useSeo, SITE_ORIGIN } from '../lib/useSeo'
import { formatDate, isPostPublic, readingTime, sortPosts, truncate } from '../lib/format'
import { sanitizeHtml, toPlainText } from '../lib/sanitize'
import { fetchPostBySlug, contentSource } from '../lib/content'

function useArticle(slug) {
  const { posts, status } = useContent()
  const fromList = posts.find((post) => post.slug === slug) || null
  // Fetch outcome is stored together with the slug it belongs to, so a stale
  // result for a previous slug can never be shown as the current article.
  const [fetched, setFetched] = useState({ slug: null, post: null })

  useEffect(() => {
    // The home query may not include every article (it is capped) or the visitor
    // may have landed directly on the permalink, so a direct fetch fills the gap.
    if (fromList || status === 'loading' || contentSource !== 'supabase') return undefined

    let active = true
    fetchPostBySlug(slug)
      .then((post) => {
        if (active) setFetched({ slug, post })
      })
      .catch(() => {
        if (active) setFetched({ slug, post: null })
      })

    return () => {
      active = false
    }
  }, [slug, fromList, status])

  if (fromList) return { post: fromList, loading: false }

  const resolved = fetched.slug === slug ? fetched.post : null
  const waiting = contentSource === 'supabase' && status !== 'local' && fetched.slug !== slug

  return { post: resolved, loading: waiting }
}

export default function ArticlePage({ slug }) {
  const { posts, site } = useContent()
  const { post, loading } = useArticle(slug)
  const [copied, setCopied] = useState(false)

  const html = useMemo(() => (post ? sanitizeHtml(post.content) : ''), [post])
  const visible = post && isPostPublic(post) ? post : null

  const related = useMemo(() => {
    if (!visible) return []
    const others = posts.filter((item) => item.id !== visible.id && isPostPublic(item))
    const sameCategory = others.filter((item) => item.category === visible.category)
    return sortPosts(sameCategory.length ? sameCategory : others).slice(0, 2)
  }, [posts, visible])

  useSeo({
    title: visible ? `${visible.seo_title || visible.title} — ${site.siteTitle}` : 'Article not found — Mahesh Dave',
    description:
      visible?.seo_description ||
      (visible ? truncate(visible.excerpt || toPlainText(visible.content), 155) : 'This article could not be found.'),
    image: visible?.cover_image_url || '/social-share.png',
    canonicalPath: visible?.canonical_url || `/blog/${slug}`,
    type: 'article',
    noindex: !visible,
    jsonLd: visible
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: visible.title,
          description: visible.seo_description || visible.excerpt,
          datePublished: visible.published_at,
          dateModified: visible.updated_at || visible.published_at,
          author: { '@type': 'Person', name: visible.author || 'Mahesh Dave' },
          publisher: { '@type': 'Person', name: 'Mahesh Dave', url: SITE_ORIGIN },
          mainEntityOfPage: absoluteUrl(`/blog/${visible.slug}`),
          image: visible.cover_image_url ? absoluteUrl(visible.cover_image_url) : undefined,
          keywords: visible.tags?.join(', '),
        }
      : null,
    jsonLdId: 'article-jsonld',
  })

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: visible?.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* the visitor cancelled or the clipboard is blocked — nothing to report */
    }
  }

  if (loading) {
    return (
      <main id="main" className="article-shell">
        <div className="article-main article-skeleton" aria-busy="true" aria-label="Loading article">
          <span className="skeleton-line short" />
          <span className="skeleton-line title" />
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line medium" />
        </div>
      </main>
    )
  }

  if (!visible) {
    return (
      <main id="main" className="article-shell">
        <div className="article-main article-missing">
          <BookOpen size={26} aria-hidden="true" />
          <h1>Article not found</h1>
          <p>
            This article may have been unpublished, renamed, or the link may be incorrect. Published notes are listed
            on the portfolio.
          </p>
          <Link className="button button-primary" to="/#blog">
            <ArrowLeft size={16} aria-hidden="true" /> Back to notes
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main id="main" className="article-shell">
      <article className="article-main">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link to="/#blog">
            <ArrowLeft size={14} aria-hidden="true" /> All notes
          </Link>
        </nav>

        <header className="article-heading">
          <p className="eyebrow">
            {visible.category || 'Engineering notes'}
            {visible.published_at ? ` · ${formatDate(visible.published_at)}` : ''} · {readingTime(visible.content)} min
            read
          </p>
          <h1>{visible.title}</h1>
          {visible.excerpt ? <p className="article-excerpt">{visible.excerpt}</p> : null}
          <button type="button" className="subtle-button article-share" onClick={share}>
            <Share2 size={14} aria-hidden="true" /> {copied ? 'Link copied' : 'Share'}
          </button>
        </header>

        {visible.cover_image_url ? (
          <img
            className="article-cover"
            src={visible.cover_image_url}
            alt=""
            width="1200"
            height="630"
            decoding="async"
          />
        ) : null}

        <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />

        {visible.tags?.length ? (
          <div className="article-tags" aria-label="Tags">
            {visible.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}

        <footer className="article-footer">
          <p>
            Written by <strong>{visible.author || 'Mahesh Dave'}</strong>
          </p>
          <TextLink href={`mailto:${site.contactEmail}`}>Discuss this article</TextLink>
        </footer>
      </article>

      {related.length ? (
        <aside className="article-related" aria-labelledby="related-title">
          <h2 id="related-title">More notes</h2>
          <div className="blog-grid">
            {related.map((item) => (
              <article className="blog-card" key={item.id}>
                <p className="eyebrow">{item.category || 'ENGINEERING NOTES'}</p>
                <h3>
                  <Link to={`/blog/${item.slug}`}>{item.title}</Link>
                </h3>
                <p>{item.excerpt || truncate(toPlainText(item.content), 140)}</p>
                <TextLink to={`/blog/${item.slug}`} icon={ArrowUpRight}>
                  Read article
                </TextLink>
              </article>
            ))}
          </div>
        </aside>
      ) : null}
    </main>
  )
}
