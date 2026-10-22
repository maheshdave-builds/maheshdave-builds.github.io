import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_THEME, applyTheme } from '../lib/theme'
import { ThemeContext, PREFERENCE_KEY } from './contexts'

/**
 * Applies the published theme to <html> and owns the visitor's light/dark
 * preference. The palette itself belongs to the admin Theme editor and arrives
 * from publishable site settings; this provider resolves `light | dark | system`
 * and writes CSS custom properties, which is the only place colours reach the DOM.
 */
export function ThemeProvider({ theme, children }) {
  const active = theme || DEFAULT_THEME

  const [preference, setPreference] = useState(() => {
    try {
      const stored = localStorage.getItem(PREFERENCE_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    } catch {
      /* storage unavailable (private mode) */
    }
    return active.mode || 'system'
  })

  const [systemDark, setSystemDark] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // A visitor's explicit choice is always respected; otherwise the theme's
  // configured default decides which palette to show.
  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    applyTheme({ ...active, mode: resolved })
  }, [active, resolved])

  const setMode = useCallback((mode) => {
    setPreference(mode)
    try {
      localStorage.setItem(PREFERENCE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setMode])

  const value = useMemo(
    () => ({ theme: active, mode: resolved, preference, setMode, toggle }),
    [active, resolved, preference, setMode, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
