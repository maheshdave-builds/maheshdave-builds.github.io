import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ImagePlus, Loader2, Save } from 'lucide-react'
import { useAdminContent } from '../contexts/hooks'
import { saveProfile, uploadImage, contentSource } from '../lib/content'
import { AdminLayout } from './AdminLayout'

function Field({ label, value, onChange, type = 'text', wide, rows, hint, placeholder }) {
  return (
    <label className={wide ? 'wide-field' : ''}>
      {label}
      {type === 'textarea' ? (
        <textarea rows={rows || 3} value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  )
}

export default function ProfilePage() {
  const { profile, reload } = useAdminContent()
  const [draft, setDraft] = useState(profile)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setDraft(profile)
  }, [profile])

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(profile), [draft, profile])

  const set = (path, value) => {
    setDraft((current) => {
      const next = { ...current }
      if (path.startsWith('about.')) {
        next.about = { ...current.about, [path.slice(6)]: value }
      } else if (path.startsWith('social_urls.')) {
        next.social_urls = { ...current.social_urls, [path.slice(12)]: value }
      } else {
        next[path] = value
      }
      return next
    })
  }

  const save = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!String(draft.name || '').trim()) {
      setError('A name is required.')
      return
    }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email)) {
      setError('The email address does not look valid.')
      return
    }
    if (contentSource !== 'supabase') {
      setError('Saving requires the configured Supabase backend.')
      return
    }

    setBusy(true)
    try {
      await saveProfile(draft)
      await reload()
      setNotice('Profile updated. The public site reflects this immediately.')
    } catch (saveError) {
      setError(saveError.message || 'The profile could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const uploadPortrait = async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadImage(file, 'profile')
      set('profileImage', url)
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <AdminLayout
      title="Profile & about"
      eyebrow="PUBLIC IDENTITY"
      actions={
        <button type="submit" form="profile-form" className="button button-primary button-sm" disabled={busy || !dirty}>
          {busy ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {busy ? 'Saving…' : 'Save profile'}
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

      <form id="profile-form" onSubmit={save} className="admin-split" noValidate>
        <div className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">IDENTITY</p>
              <h2>How you appear</h2>
            </div>
            {dirty ? <span className="unsaved-pill">Unsaved changes</span> : null}
          </div>

          <div className="admin-form-grid">
            <Field label="Full name" value={draft.name} onChange={(value) => set('name', value)} />
            <Field label="Display name" value={draft.shortName} onChange={(value) => set('shortName', value)} hint="Used in the header and hero." />
            <Field label="Professional title" value={draft.title} onChange={(value) => set('title', value)} wide />
            <Field label="Email" type="email" value={draft.email} onChange={(value) => set('email', value)} />
            <Field label="Location" value={draft.location} onChange={(value) => set('location', value)} />
            <Field
              label="Availability"
              value={draft.availability}
              onChange={(value) => set('availability', value)}
              wide
              hint="Shown in the hero meta row. Leave empty to hide it."
            />
            <Field label="Short introduction" type="textarea" rows={3} wide value={draft.intro} onChange={(value) => set('intro', value)} />
          </div>

          <div className="admin-subsection">
            <div className="editor-heading">
              <div>
                <h3>About section</h3>
                <p>Three short paragraphs rendered in the About section.</p>
              </div>
            </div>
            <div className="admin-form-grid">
              <Field label="Biography" type="textarea" rows={3} wide value={draft.about?.bio} onChange={(value) => set('about.bio', value)} />
              <Field label="Focus" type="textarea" rows={3} wide value={draft.about?.focus} onChange={(value) => set('about.focus', value)} />
              <Field label="Summary" type="textarea" rows={3} wide value={draft.about?.summary} onChange={(value) => set('about.summary', value)} />
            </div>
          </div>

          <div className="admin-subsection">
            <div className="editor-heading">
              <div>
                <h3>Links</h3>
                <p>Used in the header, contact panel and footer.</p>
              </div>
            </div>
            <div className="admin-form-grid">
              <Field label="LinkedIn URL" type="url" value={draft.social_urls?.linkedin} onChange={(value) => set('social_urls.linkedin', value)} />
              <Field label="GitHub URL" type="url" value={draft.social_urls?.github} onChange={(value) => set('social_urls.github', value)} />
              <Field
                label="Magento Stack Exchange URL"
                type="url"
                value={draft.social_urls?.stackexchange}
                onChange={(value) => set('social_urls.stackexchange', value)}
                wide
              />
              <Field label="Resume PDF URL" type="url" value={draft.resumeUrl} onChange={(value) => set('resumeUrl', value)} wide />
            </div>
          </div>
        </div>

        <aside className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">PORTRAIT</p>
              <h2>Profile photo</h2>
            </div>
          </div>

          <div className="portrait-preview">
            {draft.profileImage ? <img src={draft.profileImage} alt="Current portrait" /> : <span>No image</span>}
          </div>

          <label className="field-block">
            Image URL
            <input
              type="url"
              value={draft.profileImage || ''}
              onChange={(event) => set('profileImage', event.target.value)}
              placeholder="/profile.jpg"
            />
          </label>

          <button
            type="button"
            className="subtle-button"
            onClick={() => document.getElementById('portrait-input')?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <ImagePlus size={14} aria-hidden="true" />}
            {uploading ? 'Uploading…' : 'Upload portrait'}
          </button>
          <input
            id="portrait-input"
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              uploadPortrait(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <p className="field-hint">
            A portrait roughly 3:4 works best. Images are stored in the <code>portfolio-media</code> bucket and served
            from the CDN.
          </p>
        </aside>
      </form>
    </AdminLayout>
  )
}
