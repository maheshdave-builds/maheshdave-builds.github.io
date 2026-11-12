import { readFile, writeFile } from 'node:fs/promises'

const origin = 'https://maheshdave-builds.github.io'
const source = JSON.parse(await readFile(new URL('../public/articles-content.json', import.meta.url), 'utf8'))
const articles = Array.isArray(source.articles) ? source.articles : []
const today = new Date().toISOString().slice(0, 10)

function lastmod(value) {
  if (!value) return ''
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return ''
  const day = new Date(parsed).toISOString().slice(0, 10)
  return day > today ? today : day
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const publicArticles = articles.filter((article) => {
  if (String(article.status || '').trim().toLowerCase() !== 'published') return false
  if (!String(article.slug || '').trim()) return false
  const parsed = Date.parse(article.published_at || '')
  return !article.published_at || (Number.isFinite(parsed) && parsed <= Date.now())
})

const articleUrls = publicArticles.map((article) => ({
  loc: `${origin}/articles/${encodeURIComponent(String(article.slug).trim())}/`,
  lastmod: lastmod(article.updated_at || article.published_at || article.created_at),
}))
const newest = articleUrls.map((url) => url.lastmod).filter(Boolean).sort().at(-1) || today
const urls = [
  { loc: `${origin}/`, lastmod: newest },
  { loc: `${origin}/articles/`, lastmod: newest },
  ...articleUrls,
]
const seen = new Set()
for (const url of urls) {
  if (!url.loc.startsWith(`${origin}/`)) throw new Error(`Sitemap URL is off-host: ${url.loc}`)
  if (seen.has(url.loc)) throw new Error(`Duplicate sitemap URL: ${url.loc}`)
  seen.add(url.loc)
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`Generated sitemap with ${urls.length} public URLs (${publicArticles.length} articles).`)
