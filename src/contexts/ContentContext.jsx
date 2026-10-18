import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPublicContent, contentSource } from '../lib/content'
import { fallbackContent } from '../lib/seed'
import { DEFAULT_THEME, validateTheme } from '../lib/theme'
import { ContentContext } from './contexts'

/**
 * Public content provider. Loads once for the whole site so the portfolio and
 * article pages share a single fetch. While loading it serves the bundled seed
 * so the page never renders empty; if the fetch fails it keeps the seed and
 * records the error for a non-blocking notice.
 *
 * State is only written after the first `await`, which keeps the effect from
 * triggering a synchronous cascading render.
 */
export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => ({ ...fallbackContent, theme: DEFAULT_THEME }))
  const [status, setStatus] = useState(contentSource === 'supabase' ? 'loading' : 'local')
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (contentSource !== 'supabase') return undefined
    let active = true

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
