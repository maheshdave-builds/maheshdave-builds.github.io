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
    <button
      type="button"
      className={`subtle-button article-share article-like ${liked ? 'is-liked' : ''} ${className}`.trim()}
      onClick={handleLike}
      disabled={busy || liked}
      aria-pressed={liked}
      aria-label={label}
      title={liked ? 'Thanks for liking this article' : 'Like this article'}
    >
      <Heart size={17} aria-hidden="true" fill={liked ? 'var(--primary)' : 'none'} stroke="var(--primary)" />
      <span className="article-like-count">{count}</span>
    </button>
  )
}
