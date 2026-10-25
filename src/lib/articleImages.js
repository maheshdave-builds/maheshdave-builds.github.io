/** Site brand teal used as the default placeholder gradient base. */
const BRAND_PALETTE = ['#2f4a48', '#628f8c', '#9ec4c1']

const KEYWORD_PALETTES = {
  fastly: ['#243836', '#628f8c', '#ff8f5a'],
  magento: ['#2a3d3b', '#628f8c', '#f46f25'],
  adobe: ['#243038', '#628f8c', '#eb1000'],
  commerce: ['#1f3432', '#628f8c', '#8fb8b5'],
  performance: ['#1e3331', '#628f8c', '#9dc8ff'],
  integration: ['#223634', '#628f8c', '#c9ddd9'],
  api: ['#243836', '#628f8c', '#b8dfda'],
  cloud: ['#1f3432', '#628f8c', '#93c5fd'],
  ai: ['#243038', '#628f8c', '#c4b5fd'],
  engineering: ['#1f3432', '#628f8c', '#9ec4c1'],
}

function hashString(value = '') {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
}

function paletteForArticle(article) {
  const haystack = [
    ...(Array.isArray(article?.tags) ? article.tags : []),
    article?.category,
    article?.title,
    article?.slug,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  for (const [keyword, palette] of Object.entries(KEYWORD_PALETTES)) {
    if (haystack.includes(keyword)) return palette
  }

  const hash = hashString(haystack || 'article')
  const presets = [BRAND_PALETTE, ...Object.values(KEYWORD_PALETTES)]
  return presets[hash % presets.length]
}

function initialsForArticle(article) {
  const title = String(article?.title || 'Article').trim()
  const parts = title.split(/\s+/).filter(Boolean)
  if (!parts.length) return 'A'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function keywordLabel(article) {
  const tag = Array.isArray(article?.tags) ? article.tags.find(Boolean) : ''
  if (tag) return String(tag).trim()
  const category = String(article?.category || '').trim()
  if (category && !/^engineering notes$/i.test(category)) return category
  const title = String(article?.title || 'Article').trim()
  const word = title.split(/\s+/).find((part) => part.length > 3)
  return word || 'Article'
}

function buildPlaceholderSvg(article) {
  const [bg, accent, glow] = paletteForArticle(article)
  const initials = initialsForArticle(article)
  const label = keywordLabel(article).slice(0, 28)
  const safeLabel = label.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${safeLabel}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="${accent}"/>
      </linearGradient>
      <radialGradient id="glow" cx="28%" cy="24%" r="55%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#bg)"/>
    <rect width="1600" height="900" fill="url(#glow)"/>
    <circle cx="1300" cy="170" r="240" fill="${glow}" opacity="0.12"/>
    <text x="110" y="360" fill="#f8faf7" font-family="Georgia, 'Times New Roman', serif" font-size="176" font-weight="700" letter-spacing="-0.06em">${initials}</text>
    <text x="116" y="510" fill="#f8faf7" opacity="0.82" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="600" letter-spacing="0.08em">${safeLabel}</text>
    <text x="116" y="575" fill="#f8faf7" opacity="0.58" font-family="Arial, Helvetica, sans-serif" font-size="28" letter-spacing="0.18em">ARTICLE</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

/** Cover image for an article: uploaded banner, or a keyword-themed SVG placeholder. */
export function getArticleCoverImage(article) {
  const cover = String(article?.cover_image_url || '').trim()
  if (cover) return cover
  return buildPlaceholderSvg(article)
}

export function articleHasUploadedCover(article) {
  return Boolean(String(article?.cover_image_url || '').trim())
}
