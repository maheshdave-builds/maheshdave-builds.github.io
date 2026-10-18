import { useMemo, useState } from 'react'
import { AlertTriangle, Check, GripVertical, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useAdminContent } from '../contexts/hooks'
import { saveSetting, contentSource } from '../lib/content'
import { DEFAULT_COPY, DEFAULT_STATS } from '../lib/seed'
import { AdminLayout } from './AdminLayout'

const COPY_FIELDS = [
  { key: 'heroEyebrow', label: 'Hero eyebrow', group: 'Hero' },
  { key: 'heroHeadline', label: 'Hero headline', group: 'Hero', area: true },
  { key: 'aboutTitle', label: 'About heading', group: 'About' },
  { key: 'aboutDescription', label: 'About description', group: 'About', area: true },
  { key: 'experienceTitle', label: 'Experience heading', group: 'Experience' },
  { key: 'experienceDescription', label: 'Experience description', group: 'Experience', area: true },
  { key: 'projectsTitle', label: 'Projects heading', group: 'Projects' },
  { key: 'projectsDescription', label: 'Projects description', group: 'Projects', area: true },
  { key: 'certificationsTitle', label: 'Certifications heading', group: 'Certifications' },
  { key: 'certificationsDescription', label: 'Certifications description', group: 'Certifications', area: true },
  { key: 'educationTitle', label: 'Education heading', group: 'Education' },
  { key: 'educationDescription', label: 'Education description', group: 'Education', area: true },
  { key: 'toolkitTitle', label: 'Toolkit heading', group: 'Toolkit' },
  { key: 'toolkitDescription', label: 'Toolkit description', group: 'Toolkit', area: true },
  { key: 'blogTitle', label: 'Blog heading', group: 'Blog' },
  { key: 'blogDescription', label: 'Blog description', group: 'Blog', area: true },
  { key: 'contactTitle', label: 'Contact heading', group: 'Contact' },
  { key: 'contactDescription', label: 'Contact description', group: 'Contact', area: true },
]

const GROUPS = Array.from(new Set(COPY_FIELDS.map((field) => field.group)))

export default function PageContentPage() {
  const { site, setSite } = useAdminContent()
  const [copy, setCopy] = useState(site.copy)
  const [stats, setStats] = useState(site.stats)
  const [tech, setTech] = useState(site.techStack)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [activeGroup, setActiveGroup] = useState(GROUPS[0])

  const dirty = useMemo(
    () =>
      JSON.stringify(copy) !== JSON.stringify(site.copy) ||
      JSON.stringify(stats) !== JSON.stringify(site.stats) ||
      JSON.stringify(tech) !== JSON.stringify(site.techStack),
    [copy, stats, tech, site],
  )

  const save = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    if (contentSource !== 'supabase') {
      setError('Saving requires the configured Supabase backend.')
      setBusy(false)
      return
    }
    try {
      await saveSetting('copy', copy)
      await saveSetting('stats', stats)
      await saveSetting('tech_stack', tech)
      setSite({ ...site, copy, stats, techStack: tech })
      setNotice('Page content saved.')
    } catch (saveError) {
      setError(saveError.message || 'The content could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const resetCopy = () => {
    if (!window.confirm('Restore the original wording for every section heading and description?')) return
    setCopy(DEFAULT_COPY)
  }

  const resetStats = () => {
    if (!window.confirm('Restore the original highlights?')) return
    setStats(DEFAULT_STATS)
  }

  const updateGroup = (index, patch) => {
    setTech((current) => current.map((group, i) => (i === index ? { ...group, ...patch } : group)))
  }

  return (
    <AdminLayout
      title="Page content"
      eyebrow="PUBLIC WEBSITE COPY"
      actions={
        <button type="button" className="button button-primary button-sm" onClick={save} disabled={busy || !dirty}>
          {busy ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {busy ? 'Saving…' : 'Save changes'}
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
      {dirty ? <p className="admin-page-note">You have unsaved edits on this page.</p> : null}

      <div className="admin-split">
        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">SECTION COPY</p>
              <h2>Headings and descriptions</h2>
            </div>
            <button type="button" className="subtle-button" onClick={resetCopy}>
              <RotateCcw size={14} aria-hidden="true" /> Restore defaults
            </button>
          </div>

          <div className="segmented" role="tablist" aria-label="Section">
            {GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={activeGroup === group}
                className={activeGroup === group ? 'is-active' : ''}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="admin-form-grid">
            {COPY_FIELDS.filter((field) => field.group === activeGroup).map((field) => (
              <label key={field.key} className={field.area ? 'wide-field' : ''}>
                {field.label}
                {field.area ? (
                  <textarea
                    rows={2}
                    value={copy[field.key] ?? ''}
                    onChange={(event) => setCopy({ ...copy, [field.key]: event.target.value })}
                  />
                ) : (
                  <input
                    value={copy[field.key] ?? ''}
                    onChange={(event) => setCopy({ ...copy, [field.key]: event.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
        </section>

        <aside className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">ABOUT HIGHLIGHTS</p>
              <h2>Key figures</h2>
            </div>
            <button type="button" className="subtle-button" onClick={resetStats}>
              <RotateCcw size={14} aria-hidden="true" /> Reset
            </button>
          </div>
          <p className="field-hint">
            Four cards appear beside the About text. Only use figures you can substantiate.
          </p>

          <div className="stat-editor">
            {stats.map((stat, index) => (
              <div className="stat-edit-card" key={index}>
                <label>
                  Value
                  <input
                    value={stat.value}
                    onChange={(event) =>
                      setStats(stats.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))
                    }
                  />
                </label>
                <label>
                  Label
                  <input
                    value={stat.label}
                    onChange={(event) =>
                      setStats(stats.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="admin-panel">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">TECHNICAL TOOLKIT</p>
            <h2>Skills and technologies</h2>
            <p>Each category renders as a card on the homepage. Technologies are comma separated.</p>
          </div>
          <button
            type="button"
            className="subtle-button"
            onClick={() => setTech([...tech, { category: 'New category', items: [] }])}
          >
            <Plus size={14} aria-hidden="true" /> Add category
          </button>
        </div>

        <div className="stack-editor-list">
          {tech.map((group, index) => (
            <div className="stack-editor-row" key={`${group.category}-${index}`}>
              <GripVertical size={15} className="grip" aria-hidden="true" />
              <label>
                Category
                <input value={group.category} onChange={(event) => updateGroup(index, { category: event.target.value })} />
              </label>
              <label>
                Technologies
                <input
                  value={group.items.join(', ')}
                  onChange={(event) =>
                    updateGroup(index, {
                      items: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="record-action danger"
                aria-label="Remove category"
                onClick={() => setTech(tech.filter((_, i) => i !== index))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  )
}
