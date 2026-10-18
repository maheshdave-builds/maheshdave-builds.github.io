import { Suspense, lazy, useEffect } from 'react'
import { useRouter, matchRoute, useRouteScroll } from '../lib/routerCore'
import { useAuth } from '../contexts/hooks'
import { AdminContentProvider } from '../contexts/AdminContentContext'
import { useAdminContent } from '../contexts/hooks'
import { AdminError, AdminLoading } from './AdminLayout'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from './AuthPages'
import DashboardPage from './DashboardPage'

const ProfilePage = lazy(() => import('./ProfilePage'))
const PageContentPage = lazy(() => import('./PageContentPage'))
const CollectionPage = lazy(() => import('./CollectionPage'))
const BlogEditorPage = lazy(() => import('./BlogEditorPage'))
const MessagesPage = lazy(() => import('./MessagesPage'))
const ThemeEditorPage = lazy(() => import('./ThemeEditorPage'))
const SettingsPage = lazy(() => import('./SettingsPage'))

const COLLECTIONS = {
  projects: {
    key: 'projects',
    singular: 'project',
    title: 'Projects',
    eyebrow: 'PORTFOLIO WORK',
    description: 'Case studies, client implementations and engineering work shown on the homepage.',
  },
  experience: {
    key: 'experience',
    singular: 'experience entry',
    title: 'Experience',
    eyebrow: 'CAREER',
    description: 'Roles in reverse-chronological order. Duration is free text, e.g. “Oct 2024 – Present”.',
  },
  certifications: {
    key: 'certifications',
    singular: 'certification',
    title: 'Certifications',
    eyebrow: 'CREDENTIALS',
    description: 'Credentials with optional public verification links.',
  },
  education: {
    key: 'education',
    singular: 'qualification',
    title: 'Education',
    eyebrow: 'ACADEMIC',
    description: 'Degrees and qualifications.',
  },
}

function ProtectedAdmin() {
  const auth = useAuth()
  const { pathname, navigate } = useRouter()
  useRouteScroll()

  useEffect(() => {
    if (auth.loading) return
    if (!auth.configured) return
    if (!auth.session) {
      const next = encodeURIComponent(pathname)
      navigate(`/admin/login?next=${next}`, { replace: true })
    }
  }, [auth.loading, auth.configured, auth.session, pathname, navigate])

  if (!auth.configured) {
    return <LoginPage />
  }

  if (auth.loading) {
    return <div className="boot-screen">Checking your session…</div>
  }

  if (!auth.session) {
    return <div className="boot-screen">Redirecting to sign in…</div>
  }

  if (!auth.isAdmin) {
    return (
      <div className="boot-screen">
        <div className="admin-error" role="alert">
          <h2>Administrator role required</h2>
          <p>
            You are signed in as {auth.user?.email}, but this account does not carry the <code>admin</code> role in its
            <code> app_metadata</code>. Ask the project owner to grant it in the Supabase dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AdminContentProvider>
      <AdminRoutes />
    </AdminContentProvider>
  )
}

function AdminRoutes() {
  const { pathname } = useRouter()
  const { status, error, reload } = useAdminContent()

  if (status === 'loading') {
    return (
      <div className="admin-layout admin-layout-plain">
        <AdminLoading />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="admin-layout admin-layout-plain">
        <AdminError error={error} onRetry={() => reload().catch(() => null)} />
      </div>
    )
  }

  const collectionMatch = pathname.match(/^\/admin\/(projects|experience|certifications|education)(?:\/(new|[^/]+))?$/)

  if (collectionMatch) {
    const config = COLLECTIONS[collectionMatch[1]]
    const rawId = collectionMatch[2]
    const mode = !rawId ? 'list' : rawId === 'new' ? 'new' : 'edit'
    return (
      <Suspense fallback={<div className="boot-screen">Loading editor…</div>}>
        <CollectionPage config={config} mode={mode} recordId={mode === 'edit' ? decodeURIComponent(rawId) : null} />
      </Suspense>
    )
  }

  const blogMatch = pathname.match(/^\/admin\/blog(?:\/(new|[^/]+))?$/)
  if (blogMatch) {
    const rawId = blogMatch[1]
    const mode = !rawId ? 'list' : rawId === 'new' ? 'new' : 'edit'
    return (
      <Suspense fallback={<div className="boot-screen">Loading editor…</div>}>
        <BlogEditorPage mode={mode} recordId={mode === 'edit' ? decodeURIComponent(rawId) : null} />
      </Suspense>
    )
  }

  const routes = [
    { path: '/admin', element: <DashboardPage /> },
    { path: '/admin/profile', element: <ProfilePage /> },
    { path: '/admin/content', element: <PageContentPage /> },
    { path: '/admin/messages', element: <MessagesPage /> },
    { path: '/admin/theme', element: <ThemeEditorPage /> },
    { path: '/admin/settings', element: <SettingsPage /> },
  ]

  for (const route of routes) {
    if (matchRoute(route.path, pathname)) {
      return <Suspense fallback={<div className="boot-screen">Loading…</div>}>{route.element}</Suspense>
    }
  }

  return (
    <div className="admin-layout admin-layout-plain">
      <div className="admin-error">
        <h2>Page not found</h2>
        <p>That dashboard route does not exist.</p>
        <a className="button button-secondary" href="/admin">
          Back to overview
        </a>
      </div>
    </div>
  )
}

export default function AdminApp() {
  const { pathname } = useRouter()
  const auth = useAuth()

  if (pathname === '/admin/login') return <LoginPage />
  if (pathname === '/admin/forgot-password') return <ForgotPasswordPage />
  if (pathname === '/admin/reset-password') {
    // A recovery link signs the user in, so the reset form must be reachable
    // without the normal admin gate.
    return <ResetPasswordPage />
  }

  if (auth.configured && !auth.loading && !auth.session) {
    return <LoginPage />
  }

  return <ProtectedAdmin />
}
