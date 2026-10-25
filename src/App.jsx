import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { RouterProvider } from './lib/router'
import { useRouteScroll, useRouter, matchRoute } from './lib/routerCore'
import { ContentProvider } from './contexts/ContentContext'
import { AuthProvider } from './contexts/AuthContext'
import { PublicThemeProvider } from './components/PublicThemeProvider'
import { ThemeProvider } from './contexts/ThemeContext'
import SiteHeader, { SiteFooter, SiteFavicon } from './components/SiteChrome'
import HomePage from './pages/HomePage'
import ArticlePage from './pages/ArticlePage'
import ArticlesPage from './pages/ArticlesPage'
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

function readHashSection() {
  const hash = window.location.hash
  if (!hash) return ''
  const id = decodeURIComponent(hash.slice(1))
  return document.getElementById(id) ? id : ''
}

/** Picks the last homepage section whose top has passed the scroll marker. */
function pickActiveSection() {
  const sections = [...document.querySelectorAll('#main section[id]')]
  if (!sections.length) return readHashSection() || 'home'

  const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0
  const marker = headerHeight + Math.min(window.innerHeight * 0.28, 120)
  let current = sections[0].id

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= marker) current = section.id
  }

  return current
}

/** Tracks which section is in view so the header can mark the current link. */
function useActiveSection() {
  const { hash } = useRouter()
  const [active, setActive] = useState(() => readHashSection() || 'home')
  const lockUntilRef = useRef(0)

  const selectSection = useCallback((id) => {
    if (!id) return
    lockUntilRef.current = Date.now() + 900
    setActive(id)
  }, [])

  // Highlight immediately when the URL hash changes (nav click or browser history).
  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    if (document.getElementById(id)) selectSection(id)
  }, [hash, selectSection])

  // Scroll spy follows DOM section order, including admin structure reordering.
  useEffect(() => {
    let frame = 0
    const sync = () => {
      frame = 0
      if (Date.now() < lockUntilRef.current) return
      setActive(pickActiveSection())
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return [active, selectSection]
}

function PublicSite() {
  const { pathname } = useRouter()
  useRouteScroll()
  const [active, selectSection] = useActiveSection()

  const scrollToSection = (id) => {
    const target = document.getElementById(id)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const articleMatch = matchRoute('/articles/:slug', pathname)

  if (pathname === '/articles') {
    return <><SiteHeader activeSection="articles" /><ArticlesPage /><SiteFooter /></>
  }

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
      <SiteHeader activeSection={active} onSectionSelect={selectSection} />
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
  const { pathname, navigate } = useRouter()
  const { theme, status, error, reload } = useContent()
  useEffect(() => {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) navigate(pathname.replace(/^\/admin/, '/mdadmin'), { replace: true })
  }, [pathname, navigate])
  useRouteScroll()
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return <div className="boot-screen">Opening admin…</div>

  if (pathname === '/mdadmin' || pathname.startsWith('/mdadmin/')) {
    return (
      <ThemeProvider theme={theme}>
        <Suspense fallback={<div className="boot-screen">Loading dashboard…</div>}>
          <AdminApp />
        </Suspense>
      </ThemeProvider>
    )
  }

  // Do not flash bundled seed content while the published source is still loading.
  // A failed request is distinct from a successfully loaded empty collection.
  if (status === 'loading') return <main className="content-load-state" role="status" aria-live="polite"><span className="content-load-spinner" aria-hidden="true" /><p>Loading the latest published content…</p></main>
  if (status === 'error') return <main className="content-load-state content-load-error" role="alert"><h1>Content could not be loaded</h1><p>{error || 'The published site data is temporarily unavailable.'}</p><button type="button" className="button button-primary" onClick={reload}>Try again</button></main>
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
