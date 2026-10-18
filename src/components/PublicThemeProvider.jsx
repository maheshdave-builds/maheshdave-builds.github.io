import { ThemeProvider } from '../contexts/ThemeContext'
import { usePreviewTheme, useContent } from '../contexts/hooks'

/**
 * Wraps the public site. On the dedicated `/preview` route it also listens for
 * a theme draft posted by the admin's Theme editor and applies it over the
 * published theme. Because the preview is a separate document in an iframe,
 * nothing it applies can reach the published settings.
 */
export function PublicThemeProvider({ children, preview = false }) {
  const { theme } = useContent()
  const draft = usePreviewTheme()
  const active = preview && draft ? draft : theme

  return <ThemeProvider theme={active}>{children}</ThemeProvider>
}
