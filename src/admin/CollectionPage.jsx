import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from '../lib/RouterLink'
import { useRouter } from '../lib/routerCore'
import { useAdminContent } from '../contexts/hooks'
import { deleteRecord, saveRecord, uploadImage } from '../lib/content'
import { AdminLayout, SearchField } from './AdminLayout'

/* ------------------------------------------------------------ field schema */

function fieldsFor(key) {
  if (key === 'projects') {
    return [
      { name: 'title', label: 'Project title', required: true, wide: true },
      { name: 'category', label: 'Category', placeholder: 'Featured project' },
      { name: 'linkLabel', label: 'Link label', placeholder: 'View project' },
      { name: 'url', label: 'Project or client URL', type: 'url', wide: true, placeholder: 'https://…' },
      { name: 'description', label: 'Description', type: 'textarea', wide: true, rows: 4 },
      { name: 'techStack', label: 'Technologies', wide: true, hint: 'Comma separated — Adobe Commerce, GraphQL, PHP' },
      { name: 'image', label: 'Project image', type: 'image' },
      { name: 'sort_order', label: 'Sort order', type: 'number', hint: 'Lower numbers appear first' },
    ]
  }
  if (key === 'certifications') {
    return [
      { name: 'name', label: 'Certification name', required: true, wide: true },
      { name: 'issuer', label: 'Issuer', placeholder: 'Adobe' },
      { name: 'year', label: 'Year' },
      { name: 'verificationUrl', label: 'Verification URL', type: 'url', wide: true, placeholder: 'https://…' },
      { name: 'image', label: 'Badge or logo', type: 'image' },
      { name: 'sort_order', label: 'Sort order', type: 'number' },
    ]
  }
  if (key === 'experience') {
    return [
      { name: 'role', label: 'Role', required: true, wide: true },
      { name: 'company', label: 'Company', required: true },
      { name: 'duration', label: 'Duration', placeholder: 'Oct 2024 – Present' },
      { name: 'description', label: 'Responsibilities and achievements', type: 'textarea', wide: true, rows: 5 },
      { name: 'sort_order', label: 'Sort order', type: 'number', hint: 'Lower numbers appear first' },
    ]
  }
  return [
    { name: 'degree', label: 'Degree / qualification', required: true, wide: true },
    { name: 'school', label: 'Institution' },
    { name: 'year', label: 'Year' },
    { name: 'detail', label: 'Details', type: 'textarea', wide: true, rows: 3 },
    { name: 'sort_order', label: 'Sort order', type: 'number' },
  ]
}

function blankRecord(key) {
  return {
    id: null,
    is_published: true,
    sort_order: 0,
    ...(key === 'projects'
      ? { title: '', category: 'Featured project', linkLabel: 'View project', url: '', description: '', techStack: [], image: '', clientLinks: [] }
      : {}),
  }
}

function toForm(record, key) {
  return {
    ...blankRecord(key),
    ...record,
    techStack: Array.isArray(record.techStack) ? record.techStack.join(', ') : record.techStack || '',
    clientLinks: Array.isArray(record.clientLinks) ? record.clientLinks : [],
  }
}

function fromForm(form) {
  return {
    ...form,
    techStack: String(form.techStack || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    sort_order: Number(form.sort_order) || 0,
  }
}

/* ------------------------------------------------------------------ fields */

function ImageField({ label, value, onChange, hint }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const pick = async (file) => {
    if (!file) return
    setError('')

    if (file.size > 4 * 1024 * 1024) {
      setError('That file is larger than 4 MB. Please compress it first.')
      return
    }
    if (!/^image\/(jpeg|png|webp|avif|gif|svg\+xml)$/.test(file.type)) {
      setError('Use a JPG, PNG, WebP, AVIF or SVG image.')
      return
    }

    setBusy(true)
    try {
      const url = await uploadImage(file, 'projects')
      onChange(url)
    } catch (uploadError) {
      setError(uploadError.message || 'The upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="image-field">
      <span className="field-label">{label}</span>
      <div className="image-field-body">
        <div className="image-field-preview">
          {value ? <img src={value} alt="" /> : <ImagePlus size={20} aria-hidden="true" />}
        </div>
        <div className="image-field-controls">
          <button type="button" className="subtle-button" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <ImagePlus size={14} aria-hidden="true" />}
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          </button>
          {value ? (
            <button type="button" className="subtle-button" onClick={() => onChange('')}>
              <X size={14} aria-hidden="true" /> Remove
            </button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              pick(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <label className="field-inline">
            Or paste a URL
            <input
              type="url"
              value={value?.startsWith('data:') ? '' : value || ''}
              onChange={(event) => onChange(event.target.value)}
              placeholder="https://…"
            />
          </label>
          {hint ? <small className="field-hint">{hint}</small> : null}
          {error ? <small className="form-error">{error}</small> : null}
        </div>
      </div>
    </div>
  )
}

function ClientLinksField({ value, onChange }) {
  const links = Array.isArray(value) ? value : []
  const update = (index, patch) => onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)))
  const remove = (index) => onChange(links.filter((_, i) => i !== index))

  return (
    <div className="client-links-field">
      <span className="field-label">Client links</span>
      <small className="field-hint">Shown as a collapsible list on the project card. Leave empty for a single-link project.</small>
      {links.map((link, index) => (
        <div className="client-link-row" key={`${link.url}-${index}`}>
          <input
            aria-label={`Client ${index + 1} name`}
            value={link.name || ''}
            onChange={(event) => update(index, { name: event.target.value })}
            placeholder="Client name"
          />
          <input
            aria-label={`Client ${index + 1} URL`}
            type="url"
            value={link.url || ''}
            onChange={(event) => update(index, { url: event.target.value })}
            placeholder="https://…"
          />
          <button type="button" className="record-action danger" onClick={() => remove(index)} aria-label="Remove client link">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="subtle-button" onClick={() => onChange([...links, { name: '', url: '' }])}>
        <Plus size={14} aria-hidden="true" /> Add client link
      </button>
    </div>
  )
}

/* --------------------------------------------------------------- the page */

export default function CollectionPage({ config, mode, recordId }) {
  const { [config.key]: rows, patchCollection, reload } = useAdminContent()
  const { navigate } = useRouter()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(() => blankRecord(config.key))
  const [baseline, setBaseline] = useState(() => JSON.stringify(blankRecord(config.key)))
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const fields = useMemo(() => fieldsFor(config.key), [config.key])
  const editing = mode === 'edit'
  const record = editing ? rows.find((row) => String(row.id) === String(recordId)) : null

  useEffect(() => {
    if (mode === 'new') {
      const next = toForm(blankRecord(config.key), config.key)
      setForm(next)
      setBaseline(JSON.stringify(next))
    } else if (record) {
      const next = toForm(record, config.key)
      setForm(next)
      setBaseline(JSON.stringify(next))
    }
    setNotice('')
    setError('')
  }, [mode, record, config.key])

  const dirty = JSON.stringify(form) !== baseline

  // Warn on tab close with unsaved edits. Browser back/forward cannot be
  // intercepted reliably, so this is the honest boundary.
  useEffect(() => {
    if (!dirty) return undefined
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    if (!needle) return sorted
    return sorted.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
  }, [rows, query])

  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  const save = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    const missing = fields.filter((field) => field.required && !String(form[field.name] || '').trim())
    if (missing.length) {
      setError(`${missing.map((field) => field.label).join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`)
      return
    }

    setBusy(true)
    try {
      const saved = await saveRecord(config.key, fromForm(form))
      await reload()
      setNotice(editing ? 'Changes saved.' : 'Item published to the site.')
      setBaseline(JSON.stringify(form))
      if (!editing && saved?.id) navigate(`/admin/${config.key}`, { replace: true })
    } catch (saveError) {
      setError(saveError.message || 'The item could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row) => {
    const label = row.title || row.name || row.role || row.degree || 'this item'
    if (!window.confirm(`Delete “${label}”? This removes it from the database and cannot be undone.`)) return
    setBusy(true)
    setError('')
    try {
      await deleteRecord(config.key, row.id)
      patchCollection(config.key, (list) => list.filter((item) => item.id !== row.id))
      setNotice('Item deleted.')
    } catch (deleteError) {
      setError(deleteError.message || 'The item could not be deleted.')
    } finally {
      setBusy(false)
    }
  }

  const move = async (row, direction) => {
    const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const index = sorted.findIndex((item) => item.id === row.id)
    const swapWith = sorted[index + direction]
    if (!swapWith) return
    try {
      await saveRecord(config.key, { ...row, sort_order: swapWith.sort_order ?? 0 })
      await saveRecord(config.key, { ...swapWith, sort_order: row.sort_order ?? 0 })
      await reload()
    } catch (moveError) {
      setError(moveError.message || 'The order could not be updated.')
    }
  }

  if (editing && !record) {
    return (
      <AdminLayout title="Not found" eyebrow="CONTENT">
        <div className="admin-error">
          <h2>That {config.singular} no longer exists</h2>
          <p>It may have been deleted in another tab.</p>
          <Link className="button button-secondary" to={`/admin/${config.key}`}>
            Back to {config.title.toLowerCase()}
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const showEditor = mode !== 'list'

  return (
    <AdminLayout
      title={showEditor ? (editing ? `Edit ${config.singular}` : `New ${config.singular}`) : config.title}
      eyebrow={config.eyebrow}
      counts={{ [config.key]: rows.length }}
      actions={
        showEditor ? (
          <Link className="button button-secondary button-sm" to={`/admin/${config.key}`}>
            <ArrowLeft size={15} aria-hidden="true" /> Back to list
          </Link>
        ) : (
          <Link className="button button-primary button-sm" to={`/admin/${config.key}/new`}>
            <Plus size={15} aria-hidden="true" /> New {config.singular}
          </Link>
        )
      }
    >
      {config.key === 'projects' ? <p className="admin-page-note">{config.description}</p> : null}

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

      {showEditor ? (
        <div className="admin-split">
          <form className="admin-panel" onSubmit={save} noValidate>
            <div className="editor-heading">
              <div>
                <p className="eyebrow">DETAILS</p>
                <h2>{config.title}</h2>
              </div>
              {dirty ? <span className="unsaved-pill">Unsaved changes</span> : null}
            </div>

            <div className="admin-form-grid">
              {fields.map((field) => {
                if (field.type === 'image') {
                  return (
                    <ImageField
                      key={field.name}
                      label={field.label}
                      value={form[field.name] || ''}
                      onChange={(value) => change(field.name, value)}
                      hint={field.hint}
                    />
                  )
                }
                return (
                  <label key={field.name} className={field.wide ? 'wide-field' : ''}>
                    {field.label}
                    {field.required ? <span className="required-mark" aria-hidden="true"> *</span> : null}
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={field.rows || 4}
                        value={form[field.name] || ''}
                        onChange={(event) => change(field.name, event.target.value)}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={form[field.name] ?? ''}
                        onChange={(event) => change(field.name, event.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.hint ? <small className="field-hint">{field.hint}</small> : null}
                  </label>
                )
              })}
            </div>

            {config.key === 'projects' ? (
              <ClientLinksField value={form.clientLinks} onChange={(value) => change('clientLinks', value)} />
            ) : null}

            <label className="toggle-row">
              <span>
                <strong>Visible on the site</strong>
                <small>Unpublished items are hidden from visitors but kept here.</small>
              </span>
              <input
                type="checkbox"
                checked={form.is_published !== false}
                onChange={(event) => change('is_published', event.target.checked)}
              />
            </label>

            <div className="editor-actions">
              <button type="submit" className="button button-primary" disabled={busy}>
                {busy ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
                {busy ? 'Saving…' : editing ? 'Save changes' : `Add ${config.singular}`}
              </button>
              <Link className="button button-secondary" to={`/admin/${config.key}`}>
                Cancel
              </Link>
            </div>
          </form>

          <aside className="admin-panel admin-side-hint">
            <h2>Writing a good entry</h2>
            <p>{config.description}</p>
            <ul>
              <li>Lead with the outcome, then the technology that made it possible.</li>
              <li>Keep descriptions to two or three sentences.</li>
              <li>Only include metrics that are accurate and attributable.</li>
              <li>Sort order changes take effect immediately on the public site.</li>
            </ul>
          </aside>
        </div>
      ) : (
        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">CONTENT LIBRARY</p>
              <h2>
                {config.title} <span className="record-count">{rows.length}</span>
              </h2>
            </div>
            <SearchField value={query} onChange={setQuery} placeholder={`Search ${config.title.toLowerCase()}…`} />
          </div>

          {filtered.length ? (
            <ul className="record-list">
              {filtered.map((row) => (
                <li key={row.id}>
                  <div className="record-info">
                    <strong>{row.title || row.name || row.role || row.degree || 'Untitled'}</strong>
                    <small>
                      {row.is_published === false ? 'Hidden · ' : ''}
                      {row.category ||
                        row.company ||
                        row.issuer ||
                        row.school ||
                        row.duration ||
                        row.year ||
                        'No description'}
                    </small>
                  </div>
                  <div className="record-actions">
                    <button type="button" className="record-action" onClick={() => move(row, -1)} aria-label="Move up">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" className="record-action" onClick={() => move(row, 1)} aria-label="Move down">
                      <ArrowDown size={14} />
                    </button>
                    <Link className="record-action" to={`/admin/${config.key}/${row.id}`} aria-label="Edit">
                      <Pencil size={14} />
                    </Link>
                    <button
                      type="button"
                      className="record-action danger"
                      onClick={() => remove(row)}
                      aria-label={`Delete ${row.title || row.name || 'item'}`}
                      disabled={busy}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="records-empty">
              {query ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
              <p>{query ? 'No items match that search.' : `No ${config.title.toLowerCase()} yet.`}</p>
              {!query ? (
                <Link className="button button-secondary button-sm" to={`/admin/${config.key}/new`}>
                  <Plus size={14} aria-hidden="true" /> Add the first one
                </Link>
              ) : null}
            </div>
          )}
        </section>
      )}
    </AdminLayout>
  )
}
