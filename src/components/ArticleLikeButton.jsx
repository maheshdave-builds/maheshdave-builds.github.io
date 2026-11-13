import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { fetchArticleLikeCount, getInitialArticleLikeCount, hasUserLikedArticle, likeArticle } from '../lib/articleLikes'

export default function ArticleLikeButton({ slug, className = '', initialCount }) {
  const baseCount = Number.isFinite(Number(initialCount)) ? Number(initialCount) : getInitialArticleLikeCount(slug)
  const [count, setCount] = useState(baseCount)
  const [liked, setLiked] = useState(() => hasUserLikedArticle(slug))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    setLiked(hasUserLikedArticle(slug))
    fetchArticleLikeCount(slug)
      .then((value) => {
        if (!active) return
        const next = Number(value) || 0
        setCount((current) => Math.max(current, next))
      })
      .catch(() => {
        if (active) setCount((current) => Math.max(current, baseCount))
      })
    return () => {
      active = false
    }
  }, [slug, baseCount])

  const handleLike = async () => {
    if (busy || liked) return
    setBusy(true)
    setLiked(true)
    setCount((current) => current + 1)
    try {
      const next = await likeArticle(slug)
      const resolved = Number(next) || 0
      setCount((current) => Math.max(current, resolved))
    } catch {
      setLiked(hasUserLikedArticle(slug))
      setCount((current) => Math.max(0, current - 1))
    } finally {
      setBusy(false)
    }
  }

  const label = liked
    ? `You liked this article (${count} ${count === 1 ? 'like' : 'likes'})`
    : `Like this article (${count} ${count === 1 ? 'like' : 'likes'})`

  return (
    <section className={`article-like-section ${className}`.trim()} aria-label="Article likes">
      <button
        type="button"
        className={`button button-primary article-like-btn ${liked ? 'is-liked' : ''}`.trim()}
        onClick={handleLike}
        disabled={busy || liked}
        aria-pressed={liked}
        aria-label={label}
      >
        <Heart size={18} aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />
        <span>{liked ? 'Thanks for liking' : 'Like this article'}</span>
        <span className="article-like-count">{count}</span>
      </button>
    </section>
  )
}
