import { useEffect } from 'react'

const SITE_ORIGIN = 'https://maheshdave-builds.github.io'

function upsertMeta(selector, attrs) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === '') element.removeAttribute(key)
    else element.setAttribute(key, value)
  }
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  if (href) element.setAttribute('href', href)
}

function upsertJsonLd(id, data) {
  let element = document.getElementById(id)
  if (!data) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.id = id
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(data)
}

/**
 * Per-route document metadata. Called by each page with plain values; it writes
 * title, description, canonical, Open Graph/Twitter tags and optional JSON-LD,
 * and restores nothing (each page always sets its own), so a route change can
 * never leave a previous page's title behind.
 */
export function useSeo({ title, description, image, canonicalPath, type = 'website', noindex = false, jsonLd, jsonLdId = 'page-jsonld' }) {
  useEffect(() => {
    const fullTitle = title || 'Mahesh Dave'
    document.title = fullTitle

    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image ? absolute(image) : undefined })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })

    const canonical = canonicalPath ? absolute(canonicalPath) : undefined
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertLink('canonical', canonical)

    upsertJsonLd(jsonLdId, jsonLd)
  }, [title, description, image, canonicalPath, type, noindex, jsonLd, jsonLdId])
}

function absolute(path) {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export { absolute as absoluteUrl, SITE_ORIGIN }
