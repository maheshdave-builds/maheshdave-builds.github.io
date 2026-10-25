import { readFile } from 'node:fs/promises'

const portfolio = JSON.parse(await readFile(new URL('../public/portfolio-content.json', import.meta.url), 'utf8'))
const payload = JSON.parse(await readFile(new URL('../public/articles-content.json', import.meta.url), 'utf8'))
if (Object.hasOwn(portfolio, 'articles')) throw new Error('Article records must not be stored in portfolio-content.json.')
if (!payload || !Array.isArray(payload.articles)) throw new Error('articles-content.json must contain an articles array.')
const ids = new Set()
const slugs = new Set()
for (const article of payload.articles) {
  if (!article || typeof article !== 'object') throw new Error('Every article must be an object.')
  if (!String(article.id || '').trim()) throw new Error('Every article needs a stable ID.')
  if (!String(article.slug || '').trim()) throw new Error(`Article ${article.id} needs a slug.`)
  if (article.status !== 'published') throw new Error(`The public article file must not contain drafts (article ${article.id}).`)
  if (article.published_at && (!Number.isFinite(Date.parse(article.published_at)) || Date.parse(article.published_at) > Date.now())) throw new Error(`The public article file must not contain future-dated articles (${article.id}).`)
  if (ids.has(String(article.id))) throw new Error(`Duplicate article ID: ${article.id}`)
  if (slugs.has(String(article.slug))) throw new Error(`Duplicate article slug: ${article.slug}`)
  ids.add(String(article.id))
  slugs.add(String(article.slug))
}
const eligible = (article, now = Date.now()) => article.status === 'published' && (!article.published_at || (Number.isFinite(Date.parse(article.published_at)) && Date.parse(article.published_at) <= now))
const published = payload.articles.filter((article) => eligible(article))
if (payload.articles.length && published.length === 0 && payload.articles.some((article) => article.status === 'published' && !article.published_at)) throw new Error('An explicitly published article was incorrectly excluded.')
const syntheticOne = [{ id: 'test-one', slug: 'test-one', status: 'published' }]
const syntheticMany = [...syntheticOne, { id: 'test-two', slug: 'test-two', status: 'published' }]
if (syntheticOne.filter(eligible).length !== 1 || syntheticMany.filter(eligible).length !== 2) throw new Error('One/multiple published article visibility test failed.')
if (eligible({ id: 'test-draft', slug: 'test-draft', status: 'draft' })) throw new Error('Draft article visibility test failed.')
console.log(`Article data verified: ${payload.articles.length} records (${published.length} currently eligible for publication).`)
console.log('Synthetic visibility checks passed: one published, multiple published, draft hidden.')
