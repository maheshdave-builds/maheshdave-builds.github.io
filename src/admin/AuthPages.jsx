import { useState } from 'react'
import { ArrowLeft, KeyRound, Loader2, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            MD
          </span>
          <span className="brand-text">
            Portfolio Studio
            <small>ADMIN ACCESS</small>
          </span>
        </Link>

        <div className="auth-heading">
          <span className="auth-icon" aria-hidden="true">
            <Lock size={18} />
          </span>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        {children}

        {footer ? <div className="auth-footer">{footer}</div> : null}

        <Link className="auth-back" to="/">
          <ArrowLeft size={14} aria-hidden="true" /> Back to portfolio
        </Link>
      </div>
    </div>
  )
}

export function LoginPage({ redirectTo = '/admin' }) {
  const { signIn, setupAdmin, configured, adminConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!configured) {
    return (
      <AuthShell title="Local admin unavailable" subtitle="The admin setup could not be initialized." footer={null}>
        <p className="form-error">Please reload the page and try again.</p>
      </AuthShell>
    )
  }

  if (!adminConfigured) {
    const createAdmin = async (event) => {
      event.preventDefault(); setBusy(true); setError('')
      if (password !== confirmPassword) { setError('Passwords do not match.'); setBusy(false); return }
      try {
        await setupAdmin(email.trim(), password)
        window.history.replaceState(null, '', redirectTo)
        window.dispatchEvent(new PopStateEvent('popstate'))
      } catch (setupError) { setError(setupError.message) } finally { setBusy(false) }
    }
    return (
      <AuthShell title="Set up your admin" subtitle="Create the first administrator for this browser. Use a strong password of at least 12 characters." footer={null}>
        <div className="notice-callout notice-warning"><ShieldAlert size={18} aria-hidden="true" /><p>This is a browser-only CMS. Your edits and login are stored in this browser; they are not protected by a server and do not automatically update the live site for other visitors.</p></div>
        <form className="auth-form" onSubmit={createAdmin} noValidate>
          <label>Email address<div className="input-with-icon"><Mail size={15} aria-hidden="true" /><input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>
          <label>Create password<div className="input-with-icon"><Lock size={15} aria-hidden="true" /><input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" /></div></label>
          <label>Confirm password<div className="input-with-icon"><Lock size={15} aria-hidden="true" /><input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" /></div></label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}{busy ? 'Creating account…' : 'Create administrator'}</button>
        </form>
      </AuthShell>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
      window.history.replaceState(null, '', redirectTo)
      // The router reads the path on navigation events; dispatch one so the
      // dashboard mounts immediately after a successful sign-in.
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (signInError) {
      setError(signInError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Administrator access only. Sign in with the administrator account already registered in this browser."
      footer={<span>Offline admin · Password can be changed from account settings.</span>}
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <label>
          Email address
          <div className="input-with-icon">
            <Mail size={15} aria-hidden="true" />
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label>
          Password
          <div className="input-with-icon">
            <Lock size={15} aria-hidden="true" />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
            />
          </div>
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="button button-primary auth-submit" disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const { requestPasswordReset, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (resetError) {
      setError(resetError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email a recovery link to the address on your administrator account."
      footer={<Link to="/admin/login">Return to sign in</Link>}
    >
      {!configured ? (
        <p className="form-error">Supabase is not configured, so recovery email cannot be sent.</p>
      ) : sent ? (
        <div className="notice-callout" role="status">
          <Mail size={18} aria-hidden="true" />
          <p>
            If that address belongs to an administrator, a recovery link is on its way. The link is valid for one hour
            and can only be used once.
          </p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          <label>
            Email address
            <div className="input-with-icon">
              <Mail size={15} aria-hidden="true" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="button button-primary auth-submit" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
            {busy ? 'Sending…' : 'Send recovery link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const { verifyRecovery, updatePassword, configured, session } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Supabase sends either `#access_token=...` (implicit) or `?token_hash=...`
  // (PKCE). Both are handled so the link works regardless of project settings.
  const params = new URLSearchParams(
    window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.search,
  )
  const tokenHash = params.get('token_hash')

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 12) {
      setError('Use at least 12 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setBusy(true)
    try {
      if (!session && tokenHash) await verifyRecovery(tokenHash)
      await updatePassword(password)
      setDone(true)
      window.history.replaceState(null, '', '/admin/login')
    } catch (resetError) {
      setError(resetError.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now sign in with your new password.">
        <Link className="button button-primary auth-submit" to="/admin/login">
          Go to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use a long, unique password. It is stored only as a hash by the authentication provider."
      footer={<Link to="/admin/login">Cancel and return to sign in</Link>}
    >
      {!configured ? (
        <p className="form-error">Supabase is not configured.</p>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          <label>
            New password
            <div className="input-with-icon">
              <Lock size={15} aria-hidden="true" />
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>
          <label>
            Confirm password
            <div className="input-with-icon">
              <Lock size={15} aria-hidden="true" />
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
          </label>
          <p className="field-hint">At least 12 characters. A passphrase of several unrelated words works well.</p>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="button button-primary auth-submit" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
            {busy ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
