import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { fetchArticleLikeCount, hasUserLikedArticle, likeArticle } from '../lib/articleLikes'

export default function ArticleLikeButton({ slug, className = '' }) {
  const [count, setCount] = useState(0)
  const [liked, setLiked] = useState(() => hasUserLikedArticle(slug))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    setLiked(hasUserLikedArticle(slug))
    fetchArticleLikeCount(slug)
      .then((value) => {
        if (active) setCount(value)
      })
      .catch(() => {
        if (active) setCount(0)
      })
    return () => {
      active = false
    }
  }, [slug])

  const handleLike = async () => {
    if (busy || liked) return
    setBusy(true)
    setLiked(true)
    setCount((current) => current + 1)
    try {
      const next = await likeArticle(slug)
      setCount(next)
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
      {!liked ? <p className="article-like-note">One like per browser. The total is shared with every visitor.</p> : null}
    </section>
  )
}
