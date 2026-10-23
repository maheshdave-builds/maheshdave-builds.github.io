import { toPlainText } from './sanitize'

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

/** Rough words-per-minute estimate over plain text; 220 wpm is a common default. */
export function readingTime(html = '') {
  const words = toPlainText(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export function formatDate(value, options) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', options || { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Convert an ISO timestamp to the value a datetime-local input expects. */
export function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocal(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Posts visible to the public: published, with a publish time that has passed. */
export function isPostPublic(post, now = Date.now()) {
  if (!post) return false
  // Drafts are visible only in the explicitly requested local preview session.
  if (typeof window !== 'undefined') {
    try { if (new URLSearchParams(window.location.search).get('preview') === 'local' || window.sessionStorage.getItem('portfolio-local-preview') === '1') return true } catch { /* use public visibility rules */ }
  }
  // Be tolerant of records created by older admin builds (for example, a
  // capitalized status or an explicit is_published flag). Never require a
  // publish timestamp when the record is explicitly marked as published.
  const status = String(post.status || post.publish_status || '').trim().toLowerCase()
  const explicitlyPublished = status === 'published' || post.is_published === true || post.isPublished === true
  if (!explicitlyPublished) return false
  const timestamp = post.published_at || post.publishedAt || post.publish_date || null
  if (!timestamp) return true
  const published = new Date(timestamp).getTime()
  // Treat malformed legacy timestamps as published rather than making an
  // explicitly published article disappear from the public site.
  return !Number.isFinite(published) || published <= now
}

export function sortPosts(posts = []) {
  return [...posts].sort((a, b) => {
    const at = new Date(a.published_at || a.updated_at || 0).getTime()
    const bt = new Date(b.published_at || b.updated_at || 0).getTime()
    return bt - at
  })
}

export function truncate(value = '', length = 160) {
  const text = String(value).trim()
  if (text.length <= length) return text
  return `${text.slice(0, length - 1).trimEnd()}…`
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}
