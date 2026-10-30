/** Shared article search used by the archive page and the header search. */

export function articleSearchText(article) {
  return [article?.title, article?.excerpt, article?.content, article?.category, article?.author, ...(article?.tags || [])]
    .filter(Boolean)
    .join(' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
}

/** Same full-text match as the article archive: title, excerpt, body, category, author, and tags. */
export function articleMatchesQuery(article, query) {
  const needle = String(query || '').trim().toLocaleLowerCase()
  if (!needle) return true
  return articleSearchText(article).includes(needle)
}

export function readArticleQuery(search = '') {
  const raw = String(search || '')
  return new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw).get('q') || ''
}

/** Build `/articles` while preserving unrelated query params and applying `q`. */
export function articlesPathWithQuery(query, extraSearch = '') {
  const params = new URLSearchParams(String(extraSearch || '').replace(/^\?/, ''))
  params.delete('__ghp')
  if (String(query || '').trim()) params.set('q', query)
  else params.delete('q')
  const qs = params.toString()
  return qs ? `/articles?${qs}` : '/articles'
}
