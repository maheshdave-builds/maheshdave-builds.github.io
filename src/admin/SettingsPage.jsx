import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Database, Download, Loader2, LogOut, Moon, Save, ShieldCheck, Sun, KeyRound, Upload } from 'lucide-react'
import { useAdminContent } from '../contexts/hooks'
import { useAuth } from '../contexts/hooks'
import { useTheme } from '../contexts/hooks'
import { useRouter } from '../lib/routerCore'
import { saveSiteSettings, exportLocalContent, importLocalContent, uploadImage, publishLocalContentToGitHub } from '../lib/content'
import { AdminLayout } from './AdminLayout'
import ImageCropDialog from './ImageCropDialog'

export default function SettingsPage() {
  const { site, setSite } = useAdminContent()
  const { user, signOut, updatePassword } = useAuth()
  const { mode, setMode } = useTheme()
  const { navigate } = useRouter()

  const [draft, setDraft] = useState(site)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [logoCropFile, setLogoCropFile] = useState(null)
  const [githubToken, setGithubToken] = useState('')
  const [publishBusy, setPublishBusy] = useState(false)
  const [publishNotice, setPublishNotice] = useState('')
  const [publishError, setPublishError] = useState('')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    setDraft(site)
  }, [site])

  const dirty = JSON.stringify(draft) !== JSON.stringify(site)

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file for the logo.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Please use a logo smaller than 10 MB.'); return }
    setLogoCropFile(file)
    event.target.value = ''
  }

  const applyLogoCrop = async (croppedFile) => {
    setBusy(true); setError('')
    try { const logo = await uploadImage(croppedFile, 'branding'); setDraft(current => ({ ...current, siteLogo: logo })) }
    catch (uploadError) { setError(uploadError.message || 'The cropped logo could not be saved.') }
    finally { setBusy(false); setLogoCropFile(null) }
  }

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
    navigate('/mdadmin/login', { replace: true })
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
              Website / brand name
              <input
                value={draft.brandName || ''}
                onChange={(event) => setDraft({ ...draft, brandName: event.target.value })}
                placeholder="Mahesh Dave"
              />
              <small className="field-hint">Displayed in the website header. Leave empty to use your profile name.</small>
            </label>

            <label className="wide-field">
              Header subtitle
              <input
                value={draft.brandTagline || ''}
                onChange={(event) => setDraft({ ...draft, brandTagline: event.target.value })}
                placeholder="Adobe Commerce"
              />
              <small className="field-hint">Short text displayed below the brand name.</small>
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
                value={String(draft.siteLogo || '').startsWith('data:') ? '' : (draft.siteLogo || '')}
                onChange={(event) => setDraft({ ...draft, siteLogo: event.target.value })}
                placeholder="Paste a logo image URL (optional)"
              />
              <input type="file" accept="image/*" onChange={handleLogoUpload} aria-label="Upload website logo" />
              <small className="field-hint">Upload an image to crop it before applying, or paste a public image URL. Save settings to publish the logo and synchronize the favicon.</small>
              {draft.siteLogo ? <img src={draft.siteLogo} alt="Website logo preview" style={{ width: 72, height: 72, objectFit: 'contain', border: '1px solid var(--line)', borderRadius: 12, padding: 6 }} onError={event => { event.currentTarget.style.opacity = '.35' }} /> : null}
            </label>

            <label>Brand style
              <select value={draft.brandStyle || 'classic'} onChange={event => setDraft({ ...draft, brandStyle: event.target.value })}><option value="classic">Classic wordmark</option><option value="editorial">Editorial serif</option><option value="minimal">Minimal uppercase</option><option value="badge">Monogram badge</option></select>
              <small className="field-hint">Choose the website name and logo treatment used in the header and footer.</small>
            </label>
            <label>Footer note
              <textarea rows={3} value={draft.footerText || ''} onChange={event => setDraft({ ...draft, footerText: event.target.value })} placeholder="Building dependable commerce experiences with clarity and care."/>
              <small className="field-hint">Shown in the footer under your name and brand.</small>
            </label>
            <div className="wide-field footer-links-editor">
              <strong>Footer links</strong>
              <small className="field-hint">Add links, edit labels and URLs, reorder with arrows, or hide links from the public footer.</small>
              {(Array.isArray(draft.footerLinks) ? draft.footerLinks : []).map((link, index) => <div className="footer-link-row" key={link.id || index}>
                <input aria-label={`Footer link ${index + 1} label`} value={link.label || ''} placeholder="Link label" onChange={event => setDraft(current => ({ ...current, footerLinks: current.footerLinks.map((item, i) => i === index ? { ...item, label: event.target.value } : item) }))}/>
                <input aria-label={`Footer link ${index + 1} URL`} value={link.href || ''} placeholder="https:// or /section" onChange={event => setDraft(current => ({ ...current, footerLinks: current.footerLinks.map((item, i) => i === index ? { ...item, href: event.target.value } : item) }))}/>
                <label className="footer-link-visible"><input type="checkbox" checked={link.visible !== false} onChange={event => setDraft(current => ({ ...current, footerLinks: current.footerLinks.map((item, i) => i === index ? { ...item, visible: event.target.checked } : item) }))}/> Show</label>
                <div className="footer-link-actions"><button type="button" className="button button-secondary button-sm" disabled={index === 0} onClick={() => setDraft(current => { const links = [...(current.footerLinks || [])]; [links[index-1], links[index]] = [links[index], links[index-1]]; return { ...current, footerLinks: links } })}>↑</button><button type="button" className="button button-secondary button-sm" disabled={index === draft.footerLinks.length-1} onClick={() => setDraft(current => { const links = [...(current.footerLinks || [])]; [links[index+1], links[index]] = [links[index], links[index+1]]; return { ...current, footerLinks: links } })}>↓</button><button type="button" className="button button-secondary button-sm" onClick={() => setDraft(current => ({ ...current, footerLinks: current.footerLinks.filter((_, i) => i !== index) }))}>×</button></div>
              </div>)}
              <button type="button" className="button button-secondary button-sm" onClick={() => setDraft(current => ({ ...current, footerLinks: [...(current.footerLinks || []), { id: `footer-${Date.now()}`, label: '', href: '', visible: true }] }))}>+ Add footer link</button>
            </div>
            <label className="wide-field">
              Slider auto-advance (seconds)
              <input
                type="number"
                min="0"
                max="60"
                step="1"
                value={draft.sliderIntervalSeconds ?? 5}
                onChange={(event) => setDraft({ ...draft, sliderIntervalSeconds: Math.min(60, Math.max(0, Number(event.target.value) || 0)) })}
              />
              <small className="field-hint">Default is 5 seconds. Set to 0 to disable automatic sliding.</small>
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

        <ImageCropDialog file={logoCropFile} title="Crop website logo" onCancel={() => setLogoCropFile(null)} onApply={applyLogoCrop} />

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
            <p className="field-hint">Publish your current browser draft to the shared GitHub content file. After GitHub Pages redeploys, all devices and visitors will see the published version.</p>
            <div className="admin-panel" style={{ margin: '14px 0', padding: '14px' }}>
              <label htmlFor="github-publish-token">GitHub fine-grained personal access token</label>
              <input id="github-publish-token" type="password" autoComplete="off" value={githubToken} onChange={(event) => setGithubToken(event.target.value)} placeholder="github_pat_…" />
              <small className="field-hint">Create a fine-grained token limited to <strong>maheshdave-builds/maheshdave-builds.github.io</strong> with <strong>Contents: Read and write</strong>. It is used only for this publish action and is not saved in browser storage or included in the website source. Anyone with access to the token can modify your repository; do not share it.</small>
              {publishNotice ? <p className="form-notice" role="status">{publishNotice}</p> : null}
              {publishError ? <p className="form-error" role="alert">{publishError}</p> : null}
              <button type="button" className="button button-primary" disabled={publishBusy || !githubToken.trim()} onClick={async () => {
                setPublishBusy(true); setPublishNotice(''); setPublishError('')
                try {
                  await publishLocalContentToGitHub(githubToken)
                  setGithubToken('')
                  setPublishNotice('Published to GitHub. GitHub Actions will rebuild the site; allow a few minutes for every device to receive the update.')
                } catch (error) { setPublishError(error.message || 'Publishing failed.') }
                finally { setPublishBusy(false) }
              }}>{publishBusy ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}{publishBusy ? 'Publishing to GitHub…' : 'Publish changes to all devices'}</button>
            </div>
            <p className="field-hint">You can still export a backup or import a previous JSON backup below.</p>
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
                <dd>Browser draft + GitHub published JSON</dd>
              </div>
              <div>
                <dt>Admin access</dt>
                <dd>Browser-only password gate</dd>
              </div>
            </dl>
            <p className="field-hint">
              Unpublished edits remain in this browser. Use “Publish changes to all devices” to commit the content JSON to GitHub. The admin password screen is a convenience lock, not server-side security.
            </p>
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}
