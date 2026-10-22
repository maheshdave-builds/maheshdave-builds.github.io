// Route matching, navigation primitives and scroll restoration. The provider
// component lives in router.jsx; everything importable by consumers lives here
// so that file exports a single component.
import { createContext, useContext, useEffect } from 'react'

export const RouterContext = createContext(null)

export function matchRoute(pattern, pathname) {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = pathname.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null

  const params = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]
    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
    } else if (patternPart !== pathPart) {
      return null
    }
  }
  return params
}

/** Current pathname without a trailing slash (except the root). */
export function readPath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  let path = window.location.pathname
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (!path.startsWith('/')) path = `/${path}`
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

export function buildLocation() {
  return {
    pathname: readPath(),
    search: window.location.search,
    hash: window.location.hash,
  }
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter must be used inside <RouterProvider>')
  return context
}

/**
 * Scroll to the hash target after render, or to the top when the path changed
 * without a hash. Smooth scrolling is skipped when the visitor asked for
 * reduced motion.
 */
export function useRouteScroll() {
  const { pathname, hash } = useRouter()

  useEffect(() => {
    if (hash) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const id = decodeURIComponent(hash.slice(1))
      const frame = requestAnimationFrame(() => {
        const target = document.getElementById(id)
        if (target) {
          const header = document.querySelector('header')
          const headerHeight = header ? header.getBoundingClientRect().height : 0
          const rect = target.getBoundingClientRect()
          const available = Math.max(0, window.innerHeight - headerHeight)
          // Center short sections in the usable viewport; for long sections align
          // their top just below the fixed header so the first content is visible.
          const desiredTop = rect.height < available * 0.82
            ? window.scrollY + rect.top - headerHeight - Math.max(0, (available - rect.height) / 2)
            : window.scrollY + rect.top - headerHeight - 16
          window.scrollTo({ top: Math.max(0, desiredTop), behavior: reduce ? 'auto' : 'smooth' })
        }
      })
      return () => cancelAnimationFrame(frame)
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
    return undefined
  }, [pathname, hash])
}
