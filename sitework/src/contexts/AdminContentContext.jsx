import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminContent, getInitialAdminContent, contentSource } from '../lib/content'
import { fallbackContent } from '../lib/seed'
import { DEFAULT_THEME } from '../lib/theme'
import { AdminContentContext } from './contexts'

/**
 * Admin-side content store. Unlike the public provider this reads drafts and
 * unpublished rows, so it only mounts behind the authenticated admin shell.
 * Every query is still filtered by RLS on the server.
 *
 * Initial state is written only after the first `await`, which keeps the effect
 * from triggering a synchronous cascading render.
 */
export function AdminContentProvider({ children }) {
  const [state, setState] = useState(() => contentSource === 'local' ? getInitialAdminContent() : ({
    profile: fallbackContent.profile,
    profileRow: null,
    projects: fallbackContent.projects,
    certifications: fallbackContent.certifications,
    experience: fallbackContent.experience,
    education: fallbackContent.education,
    posts: [],
    site: fallbackContent.site,
    settingsRows: [],
    themePublished: DEFAULT_THEME,
    themeDraft: DEFAULT_THEME,
  }))
  const [status, setStatus] = useState(contentSource === 'local' ? 'ready' : 'loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (contentSource === 'local') return undefined
    let active = true

    ;(async () => {
      try {
        const next = await fetchAdminContent()
        if (!active) return
        setState(next)
        setStatus('ready')
      } catch (loadError) {
        if (!active) return
        setError(loadError)
        setStatus('error')
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const reload = useCallback(async () => {
    try {
      const next = await fetchAdminContent()
      setState(next)
      setError(null)
      setStatus('ready')
      return next
    } catch (loadError) {
      setError(loadError)
      setStatus('error')
      throw loadError
    }
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      source: contentSource,
      status,
      loading: status === 'loading',
      error,
      reload,
      /** Merge a saved record back into local state without a full refetch. */
      patchCollection(collection, updater) {
        setState((current) => ({ ...current, [collection]: updater(current[collection]) }))
      },
      setProfile(profile) {
        setState((current) => ({ ...current, profile }))
      },
      setSite(site) {
        setState((current) => ({ ...current, site }))
      },
      setThemes({ draft, published }) {
        setState((current) => ({
          ...current,
          themeDraft: draft ?? current.themeDraft,
          themePublished: published ?? current.themePublished,
        }))
      },
    }),
    [state, status, error, reload],
  )

  return <AdminContentContext.Provider value={value}>{children}</AdminContentContext.Provider>
}
