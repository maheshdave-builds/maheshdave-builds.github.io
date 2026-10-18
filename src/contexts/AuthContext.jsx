import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured, sessionIsAdmin } from '../lib/supabase'
import { AuthContext } from './contexts'

// Session state for the admin area. The client-side `isAdmin` check exists only
// to decide what to render; it is not a security boundary. Every write still
// passes through RLS, which reads the same `app_metadata.role` claim from the
// signed JWT. A visitor who tampers with this state gets a dashboard full of
// permission errors, not write access.

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return undefined

    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data?.session || null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (event === 'SIGNED_OUT') setError('')
    })

    return () => {
      active = false
      data?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      const message = /invalid|credentials/i.test(authError.message)
        ? 'That email and password combination was not recognised.'
        : authError.message
      setError(message)
      throw new Error(message)
    }
    if (!sessionIsAdmin(data)) {
      await supabase.auth.signOut()
      const message = 'This account does not have administrator access.'
      setError(message)
      throw new Error(message)
    }
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
    setSession(null)
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}admin/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, redirectTo)
    if (resetError) throw new Error(resetError.message)
  }, [])

  const verifyRecovery = useCallback(async (tokenHash) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error: verifyError } = await supabase.auth.verifyRecoveryToken({ token_hash: tokenHash })
    if (verifyError) throw new Error('This recovery link is invalid or has expired.')
    setSession(data)
    return data
  }, [])

  const updatePassword = useCallback(async (password) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    if (String(password).length < 12) throw new Error('Use at least 12 characters.')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) throw new Error(updateError.message)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      isAdmin: sessionIsAdmin(session),
      loading,
      error,
      configured: isConfigured,
      signIn,
      signOut,
      requestPasswordReset,
      verifyRecovery,
      updatePassword,
    }),
    [session, loading, error, signIn, signOut, requestPasswordReset, verifyRecovery, updatePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
