import { useCallback, useEffect, useMemo, useState } from 'react'
import { RouterContext, buildLocation, readPath } from './routerCore'

// Minimal History-API router. The site has two entry surfaces (the portfolio at
// "/" and the admin app under "/mdadmin/*") plus article permalinks at
// "/articles/:slug", so a router dependency is not warranted. Deep links on static
// hosting are rescued by public/404.html, which re-enters the app at the
// requested path.
//
// Consumers import useRouter/useRouteScroll/matchRoute from ./routerCore.
export function RouterProvider({ children }) {
  const [location, setLocation] = useState(buildLocation)

  useEffect(() => {
    const onPop = () => setLocation(buildLocation())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to, { replace = false, state } = {}) => {
    const url = new URL(to, window.location.origin)
    const current = `${readPath()}${window.location.search}${window.location.hash}`
    const next = `${url.pathname}${url.search}${url.hash}`

    if (current !== next) {
      const method = replace ? 'replaceState' : 'pushState'
      window.history[method](state ?? null, '', next)
    } else if (state !== undefined) {
      window.history.replaceState(state, '', next)
    }

    setLocation({ pathname: readPath(), search: url.search, hash: url.hash })
  }, [])

  const value = useMemo(
    () => ({ ...location, navigate, base: import.meta.env.BASE_URL.replace(/\/$/, '') }),
    [location, navigate],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}
