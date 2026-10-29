const USER_LIKES_KEY = 'portfolio-article-user-likes-v1'
const PENDING_LIKES_KEY = 'portfolio-article-like-pending-v1'
const LIKES_JSON_URL = '/article-likes.json'
const LOCAL_DEV_LIKES_KEY = 'portfolio-article-likes-local-preview'
const COUNTER_NAMESPACE = 'maheshdave-portfolio-articles'
const COUNTER_API = 'https://abacus.jasoncameron.dev'
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

function counterKey(slug) {
  return encodeURIComponent(String(slug || '').trim())
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

async function fetchCounterValue(slug, hit = false) {
  const key = counterKey(slug)
  if (!key) return 0
  const action = hit ? 'hit' : 'get'
  const response = await fetch(`${COUNTER_API}/${action}/${COUNTER_NAMESPACE}/${key}`, { cache: 'no-store' })
  const payload = await response.json().catch(() => ({}))
  if (Number.isFinite(Number(payload?.value))) return Number(payload.value)
  if (!hit && payload?.error) return 0
  if (!response.ok) throw new Error('Like counter service unavailable.')
  return 0
}

async function fetchFallbackLikeCount(slug) {
  try {
    const published = await fetchPublishedLikeCounts()
    return mergeLikeCount(slug, published)
  } catch {
    return mergeLikeCount(slug)
  }
}

/** Load the global like count for an article slug. */
export async function fetchArticleLikeCount(slug) {
  const key = String(slug || '').trim()
  if (!key) return 0

  const fallback = await fetchFallbackLikeCount(key)
  try {
    const remote = await fetchCounterValue(key, false)
    return Math.max(fallback, remote)
  } catch {
    return fallback
  }
}

/**
 * Register a like once per browser and return the updated global count.
 * Counts are stored on a public counter service so every visitor sees the same total.
 */
export async function likeArticle(slug) {
  const key = String(slug || '').trim()
  if (!key) return 0
  if (hasUserLikedArticle(key)) return fetchArticleLikeCount(key)

  markUserLiked(key)

  try {
    const remote = await fetchCounterValue(key, true)
    const fallback = await fetchFallbackLikeCount(key)
    return Math.max(fallback, remote)
  } catch {
    incrementPendingLike(key)
    return fetchFallbackLikeCount(key)
  }
}

/** Merge pending browser likes into a publish payload for GitHub backup. */
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
