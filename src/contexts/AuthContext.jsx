import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './contexts'

const ADMIN_KEY = 'mahesh-portfolio-local-admin-v1'
const SESSION_KEY = 'mahesh-portfolio-local-session-v1'
async function digest(value) {
  const bytes = new TextEncoder().encode(value)
  if (globalThis.crypto?.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Compatibility fallback; this is a convenience gate, not server security.
  return Array.from(value).reduce((acc, char) => ((acc * 31 + char.charCodeAt(0)) >>> 0), 7).toString(16)
}
function readAdmin() { try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null') } catch { return null } }
function readSession() { try { return sessionStorage.getItem(SESSION_KEY) === 'yes' } catch { return false } }

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(readAdmin)
  const [session, setSession] = useState(() => readSession() ? { user: { email: readAdmin()?.email || '' } } : null)
  const [error, setError] = useState('')
  const [loading] = useState(false)

  useEffect(() => { const refresh = () => setAdmin(readAdmin()); window.addEventListener('storage', refresh); return () => window.removeEventListener('storage', refresh) }, [])

  const setupAdmin = useCallback(async (email, password) => {
    if (readAdmin()) throw new Error('An administrator is already configured. Sign in instead.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
    if (String(password).length < 12) throw new Error('Use a password with at least 12 characters.')
    const record = { email: email.trim().toLowerCase(), passwordHash: await digest(password) }
    localStorage.setItem(ADMIN_KEY, JSON.stringify(record)); setAdmin(record)
    sessionStorage.setItem(SESSION_KEY, 'yes'); setSession({ user: { email: record.email } }); setError('')
  }, [])

  const signIn = useCallback(async (email, password) => {
    const record = readAdmin()
    if (!record) throw new Error('Create your local administrator account first.')
    if (record.email !== email.trim().toLowerCase() || record.passwordHash !== await digest(password)) {
      const message = 'Email or password is incorrect.'; setError(message); throw new Error(message)
    }
    sessionStorage.setItem(SESSION_KEY, 'yes'); setSession({ user: { email: record.email } }); setError('')
    return { user: { email: record.email } }
  }, [])

  const signOut = useCallback(async () => { sessionStorage.removeItem(SESSION_KEY); setSession(null) }, [])
  const updatePassword = useCallback(async (password) => {
    if (String(password).length < 12) throw new Error('Use a password with at least 12 characters.')
    const record = readAdmin(); if (!record) throw new Error('No administrator account is configured.')
    const next = { ...record, passwordHash: await digest(password) }; localStorage.setItem(ADMIN_KEY, JSON.stringify(next)); setAdmin(next)
  }, [])
  const requestPasswordReset = useCallback(async () => { throw new Error('Password recovery email is unavailable in offline mode. Sign in and use account settings to change your password.') }, [])
  const verifyRecovery = useCallback(async () => { throw new Error('Password recovery links are unavailable in offline mode.') }, [])

  const value = useMemo(() => ({ session, user: session?.user || null, isAdmin: Boolean(session), loading, error, configured: true, adminConfigured: Boolean(admin), setupAdmin, signIn, signOut, requestPasswordReset, verifyRecovery, updatePassword }), [session, loading, error, admin, setupAdmin, signIn, signOut, requestPasswordReset, verifyRecovery, updatePassword])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
