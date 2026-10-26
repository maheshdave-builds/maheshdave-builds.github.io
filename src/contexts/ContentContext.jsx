import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPublicContent, contentSource } from '../lib/content'
import { fallbackContent } from '../lib/seed'
import { DEFAULT_THEME, validateTheme } from '../lib/theme'
import { ContentContext } from './contexts'

/**
 * Public content provider. Renders immediately with bundled defaults, then
 * swaps in published JSON when it arrives so visitors never see a blocking loader.
 */
export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => ({ ...fallbackContent, theme: DEFAULT_THEME }))
  const [status, setStatus] = useState(contentSource === 'local' ? 'local' : 'ready')
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const next = await fetchPublicContent()
        if (!active) return
        const hasContent = next.projects.length || next.experience.length || next.certifications.length
        setContent(hasContent ? next : { ...fallbackContent, theme: next.theme, site: next.site })
        setError('')
        setStatus(contentSource === 'local' ? 'local' : 'ready')
      } catch (loadError) {
        if (!active) return
        setError(loadError?.message || 'Content could not be loaded.')
        setStatus(contentSource === 'local' ? 'local' : 'ready')
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
