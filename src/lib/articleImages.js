/**
 * Article cover placeholders when no upload exists.
 * Revert art: set PLACEHOLDER_ART to 'card' (static card layout, same colors).
 * Brand anchor: #326c69 (optional alpha #326c69c7 in design tokens).
 */
const PLACEHOLDER_ART = 'playful'

const TEAL = {
  deep: '#1a403d',
  shade: '#234845',
  base: '#326c69',
  light: '#4a8f8b',
  bright: '#6fb0ab',
  glow: '#9ec8c5',
  mist: '#c7e6e3',
  foam: '#e8f4f3',
}

/** Slight topic variation while staying in the #326c69 family. */
const KEYWORD_TINT = {
  magento: TEAL.bright,
  adobe: '#5a9e99',
  graphql: TEAL.glow,
  react: '#7abab6',
  security: '#4d7874',
  performance: TEAL.light,
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

  let pop = TEAL.bright
  for (const [keyword, tint] of Object.entries(KEYWORD_TINT)) {
    if (haystack.includes(keyword)) {
      pop = tint
      break
    }
  }

  return [TEAL.deep, TEAL.shade, TEAL.base, pop, TEAL.mist]
}

function categoryLabel(article) {
  const category = String(article?.category || '').trim()
  if (category) return category.slice(0, 32)
  const tag = Array.isArray(article?.tags) ? article.tags.find(Boolean) : ''
  if (tag) return String(tag).trim().slice(0, 32)
  return 'Engineering notes'
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function svgDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function animationStyles(uid) {
  return `<style>
    .${uid}-svg { display:block; width:100%; height:100%; }
    @keyframes ${uid}-drift-a { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(28px,-22px) scale(1.06); } }
    @keyframes ${uid}-drift-b { 0%,100% { transform:translate(0,0); } 50% { transform:translate(-24px,18px); } }
    @keyframes ${uid}-pulse { 0%,100% { opacity:.88; transform:scale(1); } 50% { opacity:.45; transform:scale(.88); } }
    @keyframes ${uid}-pulse-d1 { 0%,100% { opacity:.95; transform:scale(1); } 33% { opacity:.5; transform:scale(.9); } 66% { opacity:.75; transform:scale(.96); } }
    @keyframes ${uid}-pulse-d2 { 0%,100% { opacity:.7; transform:scale(.94); } 33% { opacity:.95; transform:scale(1); } 66% { opacity:.55; transform:scale(.88); } }
    @keyframes ${uid}-pulse-d3 { 0%,100% { opacity:.55; transform:scale(.9); } 33% { opacity:.65; transform:scale(.92); } 66% { opacity:.92; transform:scale(1); } }
    @keyframes ${uid}-shimmer { 0% { transform:translateX(-130%) skewX(-12deg); } 100% { transform:translateX(230%) skewX(-12deg); } }
    @keyframes ${uid}-wave { to { stroke-dashoffset:-160; } }
    @keyframes ${uid}-orb { 0%,100% { opacity:.22; transform:scale(1); } 50% { opacity:.38; transform:scale(1.08); } }
    @keyframes ${uid}-tilt { 0%,100% { transform:rotate(-2deg); } 50% { transform:rotate(2deg); } }
    @keyframes ${uid}-tag-float { 0%,100% { transform:rotate(-2deg) scale(1); } 50% { transform:rotate(1deg) scale(1.04); } }
    @keyframes ${uid}-tag-glow { 0%,100% { opacity:.94; } 50% { opacity:1; } }
    @keyframes ${uid}-tag-shine { 0% { transform:translateX(-120%); opacity:0; } 40% { opacity:.45; } 100% { transform:translateX(220%); opacity:0; } }
    .${uid}-blob-a { animation:${uid}-drift-a 14s ease-in-out infinite; transform-origin:center; }
    .${uid}-blob-b { animation:${uid}-drift-b 18s ease-in-out infinite; transform-origin:center; }
    .${uid}-orb { animation:${uid}-orb 9s ease-in-out infinite; transform-origin:center; }
    .${uid}-panel { animation:${uid}-tilt 12s ease-in-out infinite; transform-origin:980px 460px; }
    .${uid}-dot-1 { animation:${uid}-pulse-d1 2.4s ease-in-out infinite; transform-origin:center; }
    .${uid}-dot-2 { animation:${uid}-pulse-d2 2.4s ease-in-out infinite .35s; transform-origin:center; }
    .${uid}-dot-3 { animation:${uid}-pulse-d3 2.4s ease-in-out infinite .7s; transform-origin:center; }
    .${uid}-shimmer { animation:${uid}-shimmer 5.5s ease-in-out infinite; }
    .${uid}-wave { animation:${uid}-wave 7s linear infinite; }
    .${uid}-footer-dot { animation:${uid}-pulse 2.8s ease-in-out infinite; }
    .${uid}-tag { animation:${uid}-tag-float 5s ease-in-out infinite; transform-origin:top left; transform-box:fill-box; }
    .${uid}-tag-bg { animation:${uid}-tag-glow 3.2s ease-in-out infinite; }
    .${uid}-tag-shine { animation:${uid}-tag-shine 4.5s ease-in-out infinite; }
    @media (prefers-reduced-motion:reduce) {
      .${uid}-blob-a,.${uid}-blob-b,.${uid}-orb,.${uid}-panel,.${uid}-dot-1,.${uid}-dot-2,.${uid}-dot-3,.${uid}-shimmer,.${uid}-wave,.${uid}-footer-dot,.${uid}-tag,.${uid}-tag-bg,.${uid}-tag-shine { animation:none !important; }
    }
  </style>`
}

function buildAnimatedPlaceholderMarkup(article) {
  const palette = paletteForArticle(article)
  const [deep, shade, base, pop, mist] = palette
  const hash = hashString(article?.slug || article?.title || 'article')
  const uid = `ph${hash % 99999}`
  const category = escapeXml(categoryLabel(article))
  const blobX = 880 + (hash % 100)
  const blobY = 110 + (hash % 70)
  const tagHeight = 64
  const tagFontSize = 30
  const tagPadX = 28
  const tagWidth = Math.min(560, tagPadX * 2 + category.length * 17)
  const tagX = Math.max(48, Math.round((1600 - tagWidth) / 2))
  const tagY = 52

  return `<svg class="${uid}-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${category}">
    ${animationStyles(uid)}
    <defs>
      <linearGradient id="${uid}-sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${shade}"/>
        <stop offset="45%" stop-color="${base}"/>
        <stop offset="100%" stop-color="${deep}"/>
      </linearGradient>
      <linearGradient id="${uid}-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${TEAL.foam}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${TEAL.foam}" stop-opacity="0.14"/>
        <stop offset="100%" stop-color="${TEAL.foam}" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="${uid}-panel-clip"><rect x="720" y="280" width="520" height="360" rx="36"/></clipPath>
      <clipPath id="${uid}-tag-clip"><rect x="0" y="0" width="${tagWidth}" height="${tagHeight}" rx="16"/></clipPath>
    </defs>
    <rect width="1600" height="900" fill="url(#${uid}-sky)"/>
    <ellipse class="${uid}-blob-a" cx="200" cy="760" rx="300" ry="130" fill="${base}" opacity="0.28"/>
    <ellipse class="${uid}-blob-b" cx="${blobX}" cy="${blobY}" rx="240" ry="200" fill="${pop}" opacity="0.24"/>
    <ellipse class="${uid}-orb" cx="1290" cy="690" rx="190" ry="170" fill="${mist}" opacity="0.35"/>
    <path class="${uid}-wave" d="M 60 640 Q 360 580 680 620 T 1240 590" fill="none" stroke="${TEAL.glow}" stroke-width="5" stroke-linecap="round" opacity="0.4" stroke-dasharray="20 24" stroke-dashoffset="0"/>
    <g class="${uid}-panel">
      <rect x="720" y="280" width="520" height="360" rx="36" fill="${deep}" fill-opacity="0.62" stroke="${mist}" stroke-width="3" stroke-opacity="0.45"/>
      <rect x="720" y="280" width="520" height="360" rx="36" fill="url(#${uid}-sheen)" clip-path="url(#${uid}-panel-clip)"/>
      <g clip-path="url(#${uid}-panel-clip)">
        <rect class="${uid}-shimmer" x="720" y="280" width="220" height="360" fill="${TEAL.foam}" opacity="0.12"/>
      </g>
      <circle class="${uid}-dot-1" cx="828" cy="452" r="52" fill="${pop}"/>
      <circle class="${uid}-dot-2" cx="928" cy="452" r="38" fill="${TEAL.glow}"/>
      <circle class="${uid}-dot-3" cx="1028" cy="452" r="28" fill="${base}"/>
      <text x="768" y="580" fill="${mist}" font-family="Georgia, serif" font-size="40" font-style="italic" opacity="0.75">keep reading</text>
    </g>
    <g transform="translate(${tagX} ${tagY})">
      <g class="${uid}-tag">
      <rect class="${uid}-tag-bg" x="0" y="0" width="${tagWidth}" height="${tagHeight}" rx="16" fill="${pop}" opacity="0.96" stroke="${TEAL.foam}" stroke-width="2" stroke-opacity="0.35"/>
      <g clip-path="url(#${uid}-tag-clip)">
        <rect class="${uid}-tag-shine" x="-${tagWidth}" y="0" width="${Math.round(tagWidth * 0.55)}" height="${tagHeight}" fill="${TEAL.foam}" opacity="0.35"/>
      </g>
      <text x="${tagPadX}" y="${Math.round(tagHeight * 0.68)}" fill="${deep}" font-family="Arial, Helvetica, sans-serif" font-size="${tagFontSize}" font-weight="700" letter-spacing="0.02em">${category}</text>
      </g>
    </g>
    <g transform="translate(88 718)">
      <circle class="${uid}-footer-dot" cx="0" cy="0" r="13" fill="${pop}"/>
      <circle class="${uid}-footer-dot" style="animation-delay:.25s" cx="34" cy="0" r="13" fill="${TEAL.glow}" opacity="0.65"/>
      <circle class="${uid}-footer-dot" style="animation-delay:.5s" cx="68" cy="0" r="13" fill="${mist}" opacity="0.45"/>
      <text x="96" y="8" fill="${TEAL.foam}" opacity="0.65" font-family="Arial, sans-serif" font-size="22">article</text>
    </g>
    <text x="88" y="818" fill="${TEAL.foam}" opacity="0.42" font-family="Arial, sans-serif" font-size="24">notes · ideas · how-to</text>
  </svg>`
}

/** Static card layout (no CSS animation) — PLACEHOLDER_ART = 'card'. */
function buildPlaceholderSvgCardMarkup(article) {
  const palette = paletteForArticle(article)
  const [deep, shade, base, pop, mist] = palette
  const category = escapeXml(categoryLabel(article))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${category}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${deep}"/>
        <stop offset="55%" stop-color="${base}"/>
        <stop offset="100%" stop-color="${shade}"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#bg)"/>
    <rect x="72" y="72" width="${Math.min(560, 56 + category.length * 17)}" height="64" rx="16" fill="${pop}" opacity="0.92"/>
    <text x="100" y="115" fill="${deep}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">${category}</text>
    <circle cx="820" cy="450" r="48" fill="${pop}"/>
    <circle cx="920" cy="450" r="36" fill="${TEAL.glow}"/>
    <circle cx="1000" cy="450" r="26" fill="${base}"/>
  </svg>`
}

function buildPlaceholderSvgCard(article) {
  return svgDataUrl(buildPlaceholderSvgCardMarkup(article))
}

/** Inline animated SVG markup (use inside DOM, not as img src). */
export function getArticlePlaceholderSvgMarkup(article) {
  if (PLACEHOLDER_ART === 'card') return buildPlaceholderSvgCardMarkup(article)
  return buildAnimatedPlaceholderMarkup(article)
}

function buildPlaceholderSvg(article) {
  if (PLACEHOLDER_ART === 'card') return buildPlaceholderSvgCard(article)
  return svgDataUrl(buildAnimatedPlaceholderMarkup(article))
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
