import { createContext } from 'react'

// Context objects live apart from their providers so provider modules export a
// single component (keeping Fast Refresh intact) and the hooks barrel can import
// them without creating an import cycle.

export const AuthContext = createContext(null)
export const ContentContext = createContext(null)
export const AdminContentContext = createContext(null)
export const ThemeContext = createContext(null)

export const PREFERENCE_KEY = 'portfolio-color-preference'
export const PREVIEW_KEY = 'portfolio-theme-preview'
export const PREVIEW_MESSAGE = 'portfolio-theme-preview'
