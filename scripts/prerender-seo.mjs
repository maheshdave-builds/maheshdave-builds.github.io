import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')
const origin = 'https://maheshdave-builds.github.io'

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function truncate(str, max = 155) {
  if (!str) return ''
  const clean = String(str).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`
}

async function prerenderRoutes() {
  const templatePath = path.resolve(distDir, 'index.html')
  let template
  try {
    template = await readFile(templatePath, 'utf8')
  } catch (err) {
    console.warn('Prerender: dist/index.html not found, skipping prerender.', err.message)
    return
  }

  const articlesData = JSON.parse(await readFile(path.resolve(rootDir, 'public/articles-content.json'), 'utf8'))
  const articles = Array.isArray(articlesData.articles) ? articlesData.articles : []
  const now = Date.now()

  const publicArticles = articles.filter((article) => {
    const status = String(article.status || '').trim().toLowerCase()
    if (status !== 'published') return false
    const ts = article.published_at
    if (!ts) return true
    const parsed = Date.parse(ts)
    return !Number.isFinite(parsed) || parsed <= now
  })

  // 1. Articles Hub Page (/articles)
  const articlesDir = path.resolve(distDir, 'articles')
  await mkdir(articlesDir, { recursive: true })
  
  let hubHtml = template
    .replace(/<title>.*?<\/title>/i, `<title>Technical Articles &amp; Magento 2 Knowledge Base — Mahesh Dave</title>`)
    .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="Practical guides and architectural patterns for Adobe Commerce, Magento 2, headless storefronts, performance, and integrations by Mahesh Dave." />`)
    .replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${origin}/articles" />`)

  await writeFile(path.resolve(articlesDir, 'index.html'), hubHtml)

  // 2. Individual Article Pages (/articles/:slug)
  let count = 0
  for (const article of publicArticles) {
    if (!article.slug) continue
    const slug = String(article.slug).trim()
    const articleDir = path.resolve(articlesDir, slug)
    await mkdir(articleDir, { recursive: true })

    const title = article.seo_title || article.title || 'Article'
    const desc = article.seo_description || truncate(article.excerpt || article.content, 155)
    const canonical = `${origin}/articles/${encodeURIComponent(slug)}`
    const coverImage = article.cover_image?.startsWith('http')
      ? article.cover_image
      : article.cover_image
        ? `${origin}${article.cover_image.startsWith('/') ? '' : '/'}${article.cover_image}`
        : `${origin}/social-share.png`

    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: article.title,
      description: desc,
      url: canonical,
      mainEntityOfPage: canonical,
      image: coverImage,
      datePublished: article.published_at || article.created_at,
      dateModified: article.updated_at || article.published_at || article.created_at,
      author: {
        '@type': 'Person',
        name: article.author || 'Mahesh Dave',
        url: origin,
      },
      publisher: {
        '@type': 'Person',
        name: 'Mahesh Dave',
        url: origin,
      },
      keywords: Array.isArray(article.tags) ? article.tags.join(', ') : 'Adobe Commerce, Magento 2',
    }

    let articleHtml = template
      .replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} — Mahesh Dave</title>`)
      .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${escapeHtml(desc)}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${escapeHtml(title)} — Mahesh Dave" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${escapeHtml(desc)}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${canonical}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${coverImage}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${escapeHtml(title)} — Mahesh Dave" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${escapeHtml(desc)}" />`)
      .replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${coverImage}" />`)
      .replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${canonical}" />`)
      .replace('</head>', `  <script type="application/ld+json">\n  ${JSON.stringify(articleJsonLd, null, 2)}\n  </script>\n</head>`)

    await writeFile(path.resolve(articleDir, 'index.html'), articleHtml)
    count++
  }

  console.log(`Prerender complete: generated static HTML for /articles and ${count} individual article routes.`)
}

prerenderRoutes().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
