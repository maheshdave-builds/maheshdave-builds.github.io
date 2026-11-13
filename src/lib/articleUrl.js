/** Public article URLs. GitHub Pages serves `articles/<slug>.html` at this path with HTTP 200. */

export const ARTICLES_INDEX_PATH = '/articles.html'

export function articlePublicPath(slug) {
  const clean = String(slug || '').trim().replace(/\.html$/i, '').replace(/\/+$/, '')
  return `/articles/${encodeURIComponent(clean)}.html`
}

export function slugFromArticleParam(param) {
  return String(param || '').trim().replace(/\.html$/i, '')
}

export function isArticlesIndexPath(pathname) {
  return pathname === '/articles' || pathname === '/articles.html'
}
