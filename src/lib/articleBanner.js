/** Default article listing page banner (public/images). */
export const DEFAULT_ARTICLES_PAGE_BANNER = '/images/maheshdave-articles-banner.jpg'

export function resolveArticlesPageBannerImage(copy) {
  const custom = String(copy?.articlesPageBannerImage || '').trim()
  return custom || DEFAULT_ARTICLES_PAGE_BANNER
}
