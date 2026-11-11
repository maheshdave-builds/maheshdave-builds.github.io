import { useCallback, useEffect, useMemo, useState } from 'react'
import { contentSource, fetchPublicContent, writePublicContentCache } from '../lib/content'
import { fallbackContent, seedProfile, seedSite } from '../lib/seed'
import { DEFAULT_THEME, validateTheme } from '../lib/theme'
import { ContentContext } from './contexts'

function emptyPublicShell() {
  return {
    profile: seedProfile,
    site: seedSite,
    projects: [],
    certifications: [],
    experience: [],
    education: [],
    articles: [],
    articleLikes: {},
    theme: DEFAULT_THEME,
  }
}

function initialPublicContent() {
  if (contentSource === 'local') return { ...fallbackContent, theme: DEFAULT_THEME }
  return emptyPublicShell()
}

/**
 * Public content provider. Loads content freshly from portfolio-content.json,
 * articles-content.json, and article-likes.json so visitors only see updated content.
 */
export function ContentProvider({ children }) {
  const [content, setContent] = useState(initialPublicContent)
  const [status, setStatus] = useState(contentSource === 'local' ? 'ready' : 'loading')
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const next = await fetchPublicContent()
        if (!active) return
        setContent(next)
        writePublicContentCache(next)
        setError('')
        setStatus('ready')
      } catch (loadError) {
        if (!active) return
        setError(loadError?.message || 'Content could not be loaded.')
        setStatus('error')
      }
    }

    load()
    const onUpdate = () => load()
    window.addEventListener('portfolio-local-content-updated', onUpdate)
    window.addEventListener('portfolio-published', onUpdate)

    return () => {
      active = false
      window.removeEventListener('portfolio-local-content-updated', onUpdate)
      window.removeEventListener('portfolio-published', onUpdate)
    }
  }, [nonce])

  const reload = useCallback(async () => {
    setNonce((value) => value + 1)
  }, [])

  const value = useMemo(
    () => ({
      ...content,
      theme: validateTheme(content.theme || DEFAULT_THEME).theme,
      status,
      error,
      source: contentSource,
      reload,
    }),
    [content, status, error, reload],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}
