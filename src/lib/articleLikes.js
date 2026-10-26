const USER_LIKES_KEY = 'portfolio-article-user-likes-v1'
const PENDING_LIKES_KEY = 'portfolio-article-like-pending-v1'
const LIKES_JSON_URL = '/article-likes.json'
const LOCAL_DEV_LIKES_KEY = 'portfolio-article-likes-local-preview'
const LOCAL_DEV = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

function readUserLikes() {
  const rows = readJson(USER_LIKES_KEY, [])
  return new Set(Array.isArray(rows) ? rows.map(String) : [])
}

function readPendingLikes() {
  const map = readJson(PENDING_LIKES_KEY, {})
  return map && typeof map === 'object' ? map : {}
}

/** Whether this browser has already liked the article (one like per device). */
export function hasUserLikedArticle(slug) {
  return readUserLikes().has(String(slug || '').trim())
}

function markUserLiked(slug) {
  const next = readUserLikes()
  next.add(String(slug || '').trim())
  writeJson(USER_LIKES_KEY, [...next])
}

function incrementPendingLike(slug) {
  const key = String(slug || '').trim()
  if (!key) return 0
  const pending = readPendingLikes()
  pending[key] = Number(pending[key] || 0) + 1
  writeJson(PENDING_LIKES_KEY, pending)
  return pending[key]
}

export function readPendingLikeCounts() {
  return readPendingLikes()
}

export function clearPendingLikeCounts() {
  try { localStorage.removeItem(PENDING_LIKES_KEY) } catch { /* ignore */ }
}

async function fetchPublishedLikeCounts() {
  if (LOCAL_DEV) {
    const staged = readJson(LOCAL_DEV_LIKES_KEY, null)
    if (staged?.likes && typeof staged.likes === 'object') return staged.likes
  }

  const response = await fetch(`${LIKES_JSON_URL}?v=${Date.now()}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Could not load article likes (${response.status}).`)
  const payload = await response.json()
  return payload?.likes && typeof payload.likes === 'object' ? payload.likes : {}
}

function mergeLikeCount(slug, published = {}, pending = readPendingLikes()) {
  const key = String(slug || '').trim()
  return Number(published[key] || 0) + Number(pending[key] || 0)
}

/** Load the public like count for an article slug (published JSON + this browser's pending likes). */
export async function fetchArticleLikeCount(slug) {
  const key = String(slug || '').trim()
  if (!key) return 0

  try {
    const published = await fetchPublishedLikeCounts()
    return mergeLikeCount(key, published)
  } catch {
    return mergeLikeCount(key)
  }
}

/**
 * Register a like once per browser and return the updated count.
 * Published counts live in public/article-likes.json; pending likes from this
 * browser are merged there the next time an admin clicks Publish.
 */
export async function likeArticle(slug) {
  const key = String(slug || '').trim()
  if (!key) return 0
  if (hasUserLikedArticle(key)) return fetchArticleLikeCount(key)

  markUserLiked(key)
  incrementPendingLike(key)

  try {
    const published = await fetchPublishedLikeCounts()
    return mergeLikeCount(key, published)
  } catch {
    return mergeLikeCount(key)
  }
}

/** Merge pending browser likes into a publish payload for GitHub. */
export async function mergeArticleLikesForPublish(existing = null) {
  let published = existing?.likes && typeof existing.likes === 'object' ? { ...existing.likes } : {}
  if (!Object.keys(published).length) {
    try {
      published = await fetchPublishedLikeCounts()
    } catch {
      published = {}
    }
  }
  const pending = readPendingLikes()
  for (const [slug, delta] of Object.entries(pending)) {
    if (!slug) continue
    published[slug] = Number(published[slug] || 0) + Number(delta || 0)
  }
  return { likes: published }
}
