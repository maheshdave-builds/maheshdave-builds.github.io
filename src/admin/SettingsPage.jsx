import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Database, Download, Loader2, LogOut, Moon, Save, ShieldCheck, Sun, KeyRound, Upload } from 'lucide-react'
import { useAdminContent } from '../contexts/hooks'
import { useAuth } from '../contexts/hooks'
import { useTheme } from '../contexts/hooks'
import { useRouter } from '../lib/routerCore'
import { saveSiteSettings, exportLocalContent, importLocalContent } from '../lib/content'
import { AdminLayout } from './AdminLayout'

export default function SettingsPage() {
  const { site, setSite } = useAdminContent()
  const { user, signOut, updatePassword } = useAuth()
  const { mode, setMode } = useTheme()
  const { navigate } = useRouter()

  const [draft, setDraft] = useState(site)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    setDraft(site)
  }, [site])

  const dirty = JSON.stringify(draft) !== JSON.stringify(site)

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    setError('')

    if (!String(draft.siteTitle || '').trim()) {
      setError('A site title is required.')
      setBusy(false)
      return
    }

    try {
      await saveSiteSettings(draft)
      setSite(draft)
      setNotice('Site settings saved.')
    } catch (saveError) {
      setError(saveError.message || 'The settings could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')
    if (password.length < 12) {
      setPasswordError('Use at least 12 characters.')
      return
    }
    if (password !== confirm) {
      setPasswordError('The two passwords do not match.')
      return
    }
    setPasswordBusy(true)
    try {
      await updatePassword(password)
      setPassword('')
      setConfirm('')
      setPasswordNotice('Password changed for this browser-local administrator.')
    } catch (updateError) {
      setPasswordError(updateError.message)
    } finally {
      setPasswordBusy(false)
    }
  }

  const signOutNow = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <AdminLayout
      title="Site settings"
      eyebrow="CONFIGURATION"
      actions={
        <button type="submit" form="settings-form" className="button button-primary button-sm" disabled={busy || !dirty}>
          {busy ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      }
    >
      {notice ? (
        <p className="form-notice" role="status">
          <Check size={15} aria-hidden="true" /> {notice}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          <AlertTriangle size={15} aria-hidden="true" /> {error}
        </p>
      ) : null}

      <div className="admin-split">
        <form id="settings-form" className="admin-panel" onSubmit={save} noValidate>
          <div className="editor-heading">
            <div>
              <p className="eyebrow">IDENTITY &amp; METADATA</p>
              <h2>Site configuration</h2>
            </div>
            {dirty ? <span className="unsaved-pill">Unsaved changes</span> : null}
          </div>

          <div className="admin-form-grid">
            <label className="wide-field">
              Site title
              <input
                value={draft.siteTitle || ''}
                onChange={(event) => setDraft({ ...draft, siteTitle: event.target.value })}
              />
              <small className="field-hint">Used as the browser tab title and in search results.</small>
            </label>

            <label className="wide-field">
              Site description
              <textarea
                rows={3}
                value={draft.siteDescription || ''}
                onChange={(event) => setDraft({ ...draft, siteDescription: event.target.value })}
                maxLength={180}
              />
              <small className="field-hint">{180 - (draft.siteDescription?.length || 0)} characters left. Used for meta descriptions and social previews.</small>
            </label>

            <label className="wide-field">
              Contact email
              <input
                type="email"
                value={draft.contactEmail || ''}
                onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })}
              />
              <small className="field-hint">Shown in the contact panel and footer.</small>
            </label>

            <label className="wide-field">
              Logo URL
              <input
                type="url"
                value={draft.siteLogo || ''}
                onChange={(event) => setDraft({ ...draft, siteLogo: event.target.value })}
                placeholder="Leave empty to use the monogram"
              />
              <small className="field-hint">Upload images in a project entry, or paste a URL from the media bucket.</small>
            </label>
          </div>

          <label className="toggle-row">
            <span>
              <strong>Show client implementations</strong>
              <small>Include the client storefront card in the projects grid.</small>
            </span>
            <input
              type="checkbox"
              checked={draft.showClientProjects !== false}
              onChange={(event) => setDraft({ ...draft, showClientProjects: event.target.checked })}
            />
          </label>
        </form>

        <div className="settings-side">
          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">APPEARANCE</p>
                <h2>Dashboard theme</h2>
              </div>
            </div>
            <p className="field-hint">This only affects your admin screens. The public palette is in Theme &amp; branding.</p>
            <div className="segmented">
              <button type="button" className={mode === 'light' ? 'is-active' : ''} onClick={() => setMode('light')}>
                <Sun size={13} aria-hidden="true" /> Light
              </button>
              <button type="button" className={mode === 'dark' ? 'is-active' : ''} onClick={() => setMode('dark')}>
                <Moon size={13} aria-hidden="true" /> Dark
              </button>
            </div>
          </section>

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">ACCOUNT</p>
                <h2>Your administrator account</h2>
              </div>
            </div>
            <dl className="settings-list">
              <div>
                <dt>Email</dt>
                <dd>{user?.email}</dd>
              </div>
              <div>
                <dt>Role claim</dt>
                <dd>{user?.app_metadata?.role || 'none'}</dd>
              </div>
              <div>
                <dt>Last sign-in</dt>
                <dd>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—'}</dd>
              </div>
            </dl>
            <button type="button" className="button button-secondary" onClick={signOutNow}>
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </section>

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">SECURITY</p>
                <h2>Change password</h2>
              </div>
              <KeyRound size={16} aria-hidden="true" />
            </div>
            <form onSubmit={changePassword} className="stack-form">
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <label>
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
              </label>
              {passwordNotice ? <p className="form-notice">{passwordNotice}</p> : null}
              {passwordError ? (
                <p className="form-error" role="alert">
                  {passwordError}
                </p>
              ) : null}
              <button type="submit" className="button button-secondary" disabled={passwordBusy}>
                {passwordBusy ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
                {passwordBusy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">BACKUP</p>
                <h2>Export or restore content</h2>
              </div>
              <Database size={16} aria-hidden="true" />
            </div>
            <p className="field-hint">Download a JSON backup before clearing browser data or moving to another browser. Importing replaces the current local portfolio content.</p>
            <div className="admin-welcome-actions">
              <button type="button" className="button button-secondary" onClick={() => { const blob = new Blob([exportLocalContent()], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mahesh-portfolio-backup.json'; anchor.click(); URL.revokeObjectURL(url) }}>
                <Download size={15} aria-hidden="true" /> Export backup
              </button>
              <label className="button button-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={15} aria-hidden="true" /> Import backup
                <input type="file" accept="application/json,.json" hidden onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { importLocalContent(await file.text()); setNotice('Backup imported. Reload the page to refresh all editors.'); window.location.reload() } catch (importError) { setError(importError.message || 'Backup import failed.') } finally { event.target.value = '' } }} />
              </label>
            </div>
          </section>

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">STORAGE</p>
                <h2>Browser-local mode</h2>
              </div>
              <Database size={16} aria-hidden="true" />
            </div>
            <dl className="settings-list">
              <div>
                <dt>Source</dt>
                <dd>Local storage</dd>
              </div>
              <div>
                <dt>Admin access</dt>
                <dd>Browser-only password gate</dd>
              </div>
            </dl>
            <p className="field-hint">
              Content, theme settings, and the admin password hash stay in this browser. This is a convenience lock, not server-side security; edits do not sync to other visitors automatically.
            </p>
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}
