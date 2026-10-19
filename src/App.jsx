import { Suspense, lazy, useEffect, useState } from 'react'
import { RouterProvider } from './lib/router'
import { useRouteScroll, useRouter, matchRoute } from './lib/routerCore'
import { ContentProvider } from './contexts/ContentContext'
import { AuthProvider } from './contexts/AuthContext'
import { PublicThemeProvider } from './components/PublicThemeProvider'
import { ThemeProvider } from './contexts/ThemeContext'
import SiteHeader, { SiteFooter, SiteFavicon } from './components/SiteChrome'
import { NAV_ITEMS } from './lib/navigation'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import NotFoundPage from './pages/NotFoundPage'
import { useContent } from './contexts/hooks'
import ThemeCursor from './components/ThemeCursor'

// The admin dashboard, its rich-text editor and the theme tooling are the
// heaviest part of the app and are only needed by the site owner, so they are
// split into their own chunk and never shipped to public visitors.
const AdminApp = lazy(() => import('./admin/AdminApp'))

function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}

/** Tracks which section is in view so the header can mark the current link. */
function useActiveSection() {
  const [active, setActive] = useState('home')

  useEffect(() => {
    const ids = ['home', ...NAV_ITEMS.map((item) => item.href.slice(1))]
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return active
}

function PublicSite() {
  const { pathname } = useRouter()
  useRouteScroll()
  const active = useActiveSection()

  const scrollToSection = (id) => {
    const target = document.getElementById(id)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const articleMatch = matchRoute('/blog/:slug', pathname)

  if (articleMatch) {
    return (
      <>
        <SiteHeader activeSection="" />
        <ArticlePage slug={articleMatch.slug} />
        <SiteFooter />
      </>
    )
  }

  if (pathname !== '/' && pathname !== '/preview') {
    return (
      <>
        <SiteHeader activeSection="" />
        <NotFoundPage />
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <ScrollProgress />
      <SiteHeader activeSection={active} />
      <HomePage onSection={scrollToSection} />
      <SiteFooter />
    </>
  )
}

function PublicRoute({ preview }) {
  return (
    <PublicThemeProvider preview={preview}>
      <PublicSite />
    </PublicThemeProvider>
  )
}

function Routes() {
  const { pathname } = useRouter()
  const { theme } = useContent()
  useRouteScroll()

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (
      <ThemeProvider theme={theme}>
        <Suspense fallback={<div className="boot-screen">Loading dashboard…</div>}>
          <AdminApp />
        </Suspense>
      </ThemeProvider>
    )
  }

  if (pathname === '/preview') return <PublicRoute preview />
  return <PublicRoute />
}

export default function App() {
  return (
    <RouterProvider>
      <ThemeCursor />
      <ContentProvider>
        <SiteFavicon />
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </ContentProvider>
    </RouterProvider>
  )
}
