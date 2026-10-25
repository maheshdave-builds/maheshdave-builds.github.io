import { readFile, writeFile } from 'node:fs/promises'

const origin = 'https://maheshdave-builds.github.io'
const source = JSON.parse(await readFile(new URL('../public/portfolio-content.json', import.meta.url), 'utf8'))
const bySlug = new Map()
for (const key of ['articles', 'blogPosts', 'posts']) {
  for (const post of Array.isArray(source[key]) ? source[key] : []) {
    const slug = String(post?.slug || '').trim().toLowerCase()
    if (slug) bySlug.set(slug, { ...(bySlug.get(slug) || {}), ...post })
  }
}
const posts = [...bySlug.values()]
const now = Date.now()
const publicPosts = posts.filter((post) => {
  const status = String(post.status || post.publish_status || '').trim().toLowerCase()
  const published = status === 'published' || post.is_published === true || post.isPublished === true
  if (!published) return false
  const timestamp = post.published_at || post.publishedAt || post.publish_date
  if (!timestamp) return true
  const parsed = Date.parse(timestamp)
  return !Number.isFinite(parsed) || parsed <= now
})
const urls = [
  { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${origin}/articles`, changefreq: 'weekly', priority: '0.8' },
  ...publicPosts.filter((post) => post.slug).map((post) => ({
    loc: `${origin}/articles/${encodeURIComponent(String(post.slug).trim())}`,
    lastmod: post.updated_at || post.published_at || post.created_at,
    changefreq: 'monthly',
    priority: '0.7',
  })),
]
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url.loc.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</loc>${url.lastmod && !Number.isNaN(Date.parse(url.lastmod)) ? `<lastmod>${new Date(url.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`).join('\n')}\n</urlset>\n`
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`Generated sitemap with ${urls.length} public URLs (${publicPosts.length} articles).`)
