import { useCallback, useMemo } from 'react'
import { AuthContext } from './contexts'

// Static GitHub Pages mode: no external authentication service is used.
// This admin workspace only edits a local draft and exports JSON for publishing.
// It is not a security boundary; do not store secrets here.
const localUser = { id: 'local-admin', email: 'Local portfolio editor', app_metadata: { role: 'admin' } }
export function AuthProvider({ children }) {
  const session = useMemo(() => ({ user: localUser, access_token: 'local-draft-only' }), [])
  const signIn = useCallback(async () => session, [session])
  const signOut = useCallback(async () => {}, [])
  const updatePassword = useCallback(async () => { throw new Error('This static GitHub-only editor has no account or password service. It only edits a local draft.') }, [])
  const requestPasswordReset = useCallback(async () => { throw new Error('Password reset is unavailable in static-only mode.') }, [])
  const verifyRecovery = useCallback(async () => { throw new Error('Account recovery is unavailable in static-only mode.') }, [])
  const value = useMemo(() => ({ session, user: localUser, isAdmin: true, loading: false, error: '', configured: true, adminConfigured: true, setupAdmin: async () => {}, signIn, signOut, requestPasswordReset, verifyRecovery, updatePassword }), [session, signIn, signOut, requestPasswordReset, verifyRecovery, updatePassword])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
