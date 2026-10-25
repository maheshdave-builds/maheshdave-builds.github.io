import { readFile, writeFile } from 'node:fs/promises'

const origin = 'https://maheshdave-builds.github.io'
const source = JSON.parse(await readFile(new URL('../public/articles-content.json', import.meta.url), 'utf8'))
const articles = Array.isArray(source.articles) ? source.articles : []
const now = Date.now()
const publicArticles = articles.filter((article) => {
  const status = String(article.status || '').trim().toLowerCase()
  const published = status === 'published' || false
  if (!published) return false
  const timestamp = article.published_at
  if (!timestamp) return true
  const parsed = Date.parse(timestamp)
  return !Number.isFinite(parsed) || parsed <= now
})
const urls = [
  { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${origin}/articles`, changefreq: 'weekly', priority: '0.8' },
  ...publicArticles.filter((article) => article.slug).map((article) => ({
    loc: `${origin}/articles/${encodeURIComponent(String(article.slug).trim())}`,
    lastmod: article.updated_at || article.published_at || article.created_at,
    changefreq: 'monthly',
    priority: '0.7',
  })),
]
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url.loc.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</loc>${url.lastmod && !Number.isNaN(Date.parse(url.lastmod)) ? `<lastmod>${new Date(url.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`).join('\n')}\n</urlset>\n`
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`Generated sitemap with ${urls.length} public URLs (${publicArticles.length} articles).`)
