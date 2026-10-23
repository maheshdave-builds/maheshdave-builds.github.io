import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './contexts'
import { supabase, isConfigured as supabaseConfigured } from '../lib/supabase'
import { authenticateGateway, clearGatewaySession, getGatewayPassword, githubGatewayConfigured } from '../lib/githubGateway'

const GATEWAY_SESSION_KEY = 'portfolio-github-admin-session'
export function AuthProvider({ children }) {
  const gatewayMode = githubGatewayConfigured()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabaseConfigured && !gatewayMode))
  const [error, setError] = useState('')
  useEffect(() => {
    if (gatewayMode) {
      const password = getGatewayPassword()
      if (password) setSession({ access_token: password, user: { id: 'github-admin', email: 'admin@portfolio.local', app_metadata: { role: 'admin' } } })
      setLoading(false); return undefined
    }
    if (!supabaseConfigured || !supabase) { setLoading(false); return undefined }
    let active = true
    supabase.auth.getSession().then(({ data, error: sessionError }) => { if (!active) return; setSession(data?.session || null); setError(sessionError?.message || ''); setLoading(false) }).catch((e) => { if (active) { setError(e.message || 'Could not verify session'); setLoading(false) } })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { if (active) setSession(nextSession || null) })
    return () => { active = false; data?.subscription?.unsubscribe() }
  }, [gatewayMode])
  const signIn = useCallback(async (email, password) => {
    if (githubGatewayConfigured()) { const next = await authenticateGateway(password); setSession(next); setError(''); return next }
    if (!supabaseConfigured || !supabase) throw new Error('GitHub publishing sign-in is unavailable. Check that this site is served from GitHub Pages.')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (authError) { setError(authError.message); throw new Error(authError.message) }
    const role = data?.user?.app_metadata?.role; const roles = data?.user?.app_metadata?.roles || []
    if (role !== 'admin' && !roles.includes('admin')) { await supabase.auth.signOut(); throw new Error('This account is not authorized for administrator access.') }
    setSession(data.session); setError(''); return data
  }, [])
  const signOut = useCallback(async () => { if (githubGatewayConfigured()) clearGatewaySession(); else if (supabase) await supabase.auth.signOut(); setSession(null) }, [])
  const updatePassword = useCallback(async (password) => { if (githubGatewayConfigured()) throw new Error('Change ADMIN_PASSWORD in your GitHub gateway Worker secrets instead.'); if (!supabase) throw new Error('Cloud authentication is not configured.'); if (String(password).length < 12) throw new Error('Use a password with at least 12 characters.'); const { error: e } = await supabase.auth.updateUser({ password }); if (e) throw new Error(e.message) }, [])
  const requestPasswordReset = useCallback(async () => { throw new Error('Password reset is managed through your GitHub gateway Worker ADMIN_PASSWORD secret.') }, [])
  const verifyRecovery = useCallback(async () => { if (!supabase) throw new Error('Password recovery is not available in GitHub gateway mode.') }, [])
  const user = session?.user || null
  const isAdmin = Boolean(user && (user.app_metadata?.role === 'admin' || user.app_metadata?.roles?.includes('admin')))
  const configured = gatewayMode || supabaseConfigured
  const value = useMemo(() => ({ session, user, isAdmin, loading, error, configured, adminConfigured: configured, setupAdmin: async () => { throw new Error('Set the ADMIN_PASSWORD Worker secret to control administrator access.') }, signIn, signOut, requestPasswordReset, verifyRecovery, updatePassword }), [session, user, isAdmin, loading, error, configured, signIn, signOut, requestPasswordReset, verifyRecovery, updatePassword])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
