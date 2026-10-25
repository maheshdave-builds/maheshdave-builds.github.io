import { useContext, useEffect, useState } from 'react'
import { AuthContext, ContentContext, AdminContentContext, ThemeContext, PREVIEW_KEY, PREVIEW_MESSAGE } from './contexts'
import { validateTheme } from '../lib/theme'

// Consumers import hooks from here so provider files export components only,
// which keeps React Fast Refresh working during development.

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) throw new Error('useContent must be used inside <ContentProvider>')
  return context
}

export function useAdminContent() {
  const context = useContext(AdminContentContext)
  if (!context) throw new Error('useAdminContent must be used inside <AdminContentProvider>')
  return context
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}

/**
 * Read a theme draft pushed by the admin's live-preview iframe. The admin articles
 * a validated theme into the preview frame over postMessage; the frame applies it
 * locally and never writes to the database, so previewing cannot publish.
 */
export function usePreviewTheme() {
  const [preview, setPreview] = useState(() => {
    if (typeof window === 'undefined' || !window.location.pathname.includes('/preview')) return null
    try {
      const stored = sessionStorage.getItem(PREVIEW_KEY)
      return stored ? validateTheme(JSON.parse(stored)).theme : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || data.type !== PREVIEW_MESSAGE) return
      const { theme } = validateTheme(data.theme)
      try {
        sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(theme))
      } catch {
        /* ignore quota */
      }
      setPreview(theme)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return preview
}
