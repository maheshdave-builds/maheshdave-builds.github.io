import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPublicContent, contentSource } from '../lib/content'
import { fallbackContent } from '../lib/seed'
import { DEFAULT_THEME, validateTheme } from '../lib/theme'
import { ContentContext } from './contexts'

/**
 * Public content provider. Loads once for the whole site so the portfolio and
 * article pages share a single source. The public route shows a stable loading
 * shell until this request resolves, rather than briefly rendering stale seed data.
 * Fetch failures are represented as an explicit error state, never an empty list.
 *
 * State is only written after the first `await`, which keeps the effect from
 * triggering a synchronous cascading render.
 */
export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => ({ ...fallbackContent, theme: DEFAULT_THEME }))
  const [status, setStatus] = useState(contentSource === 'local' ? 'local' : 'loading')
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    const loadLocal = async () => {
      try { const next = await fetchPublicContent(); if (active) { setContent(next); setStatus(contentSource === 'local' ? 'local' : 'ready'); setError('') } }
      catch (loadError) { if (active) { setError(loadError?.message || 'Content could not be loaded.'); setStatus('error') } }
    }
    if (contentSource === 'local' || contentSource === 'github') { loadLocal(); const onUpdate = () => loadLocal(); window.addEventListener('portfolio-local-content-updated', onUpdate); return () => { active = false; window.removeEventListener('portfolio-local-content-updated', onUpdate) } }

    ;(async () => {
      try {
        const next = await fetchPublicContent()
        if (!active) return
        // An empty database is a valid state, but empty projects and experience
        // almost always mean setup did not finish; keep the seed so the site
        // does not go blank after a misconfigured migration.
        const hasContent = next.projects.length || next.experience.length || next.certifications.length
        setContent(hasContent ? next : { ...fallbackContent, theme: next.theme, site: next.site })
        setError('')
        setStatus('ready')
      } catch (loadError) {
        if (!active) return
        setError(loadError?.message || 'Content could not be loaded.')
        setStatus('error')
      }
    })()

    return () => {
      active = false
    }
  }, [nonce])

  /** Manual retry, used by the error state in the UI. */
  const reload = useCallback(async () => {
    setStatus('loading')
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
