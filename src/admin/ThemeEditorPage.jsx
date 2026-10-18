import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Contrast,
  Eye,
  Loader2,
  Monitor,
  Moon,
  Paintbrush,
  RotateCcw,
  Save,
  Sun,
  UploadCloud,
  X,
} from 'lucide-react'
import { useAdminContent } from '../contexts/hooks'
import { saveSetting, contentSource } from '../lib/content'
import {
  COLOR_KEYS,
  DEFAULT_THEME,
  FONT_STACKS,
  PALETTES,
  SCALE_OPTIONS,
  THEME_PRESETS,
  contrastIssues,
  fontFor,
  hexToRgb,
  readableOn,
  validateTheme,
} from '../lib/theme'
import { AdminLayout } from './AdminLayout'

const COLOR_GROUPS = Array.from(new Set(COLOR_KEYS.map((color) => color.group)))

function ColorRow({ mode, item, value, onChange, onAutoFix }) {
  const rgb = hexToRgb(value)
  const contrastBody = useMemo(() => readableOn(value), [value])

  return (
    <div className="color-row">
      <input
        type="color"
        value={value}
        aria-label={`${item.label} (${mode})`}
        onChange={(event) => onChange(event.target.value)}
        style={{ background: value }}
      />
      <div className="color-meta">
        <strong>{item.label}</strong>
        <small>{value.toUpperCase()}</small>
      </div>
      <code className="color-rgb" aria-hidden="true">
        {rgb.r} {rgb.g} {rgb.b}
      </code>
      <button
        type="button"
        className="color-auto"
        title="Choose a text colour with readable contrast against this background"
        onClick={() => onAutoFix(item.key, value)}
        style={{ color: contrastBody === '#ffffff' ? '#111' : '#fff', background: value }}
      >
        Aa
      </button>
    </div>
  )
}

/**
 * Live preview. This is a same-origin iframe of the real `/preview` route, so
 * what the editor shows is the actual site markup and stylesheet — not an
 * approximation. The draft theme is posted in; nothing is written to the
 * database until the owner presses Publish.
 */
function LivePreview({ theme, mode, device, onDevice }) {
  const frameRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  const push = useCallback(() => {
    const frame = frameRef.current
    if (!frame?.contentWindow) return
    frame.contentWindow.postMessage(
      { type: 'portfolio-theme-preview', theme: { ...theme, mode } },
      window.location.origin,
    )
  }, [theme, mode])

  useEffect(() => {
    if (loaded) push()
  }, [loaded, push])

  useEffect(() => {
    // Repaint after the frame reloads (device switch) once the document is ready.
    const frame = frameRef.current
    if (!frame) return undefined
    const onLoad = () => {
      setLoaded(false)
      window.setTimeout(() => setLoaded(true), 60)
    }
    frame.addEventListener('load', onLoad)
    return () => frame.removeEventListener('load', onLoad)
  }, [])

  const src = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/preview`

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <div className="segmented compact" role="group" aria-label="Preview viewport">
          <button type="button" className={device === 'desktop' ? 'is-active' : ''} onClick={() => onDevice('desktop')}>
            <Monitor size={13} aria-hidden="true" /> Desktop
          </button>
          <button type="button" className={device === 'mobile' ? 'is-active' : ''} onClick={() => onDevice('mobile')}>
            <Eye size={13} aria-hidden="true" /> Mobile
          </button>
        </div>
        <button type="button" className="subtle-button" onClick={() => frameRef.current?.contentWindow?.location.reload()}>
          Reload preview
        </button>
      </div>

      <div className={`preview-frame-wrap ${device}`}>
        <iframe
          ref={frameRef}
          src={src}
          title="Live theme preview"
          className="preview-frame"
          onLoad={() => setLoaded(true)}
        />
        {!loaded ? (
          <div className="preview-loading">
            <Loader2 size={18} className="spin" aria-hidden="true" /> Loading preview…
          </div>
        ) : null}
      </div>
      <p className="field-hint">
        The preview is the live site rendered in an isolated frame. Draft colours are applied here only; visitors keep
        seeing the published theme until you publish.
      </p>
    </div>
  )
}

export default function ThemeEditorPage() {
  const { themeDraft, themePublished, setThemes } = useAdminContent()
  const [draft, setDraft] = useState(themeDraft || DEFAULT_THEME)
  const [tab, setTab] = useState('colors')
  const [mode, setMode] = useState(themeDraft?.mode === 'dark' ? 'dark' : themeDraft?.mode === 'system' ? 'light' : 'light')
  const [device, setDevice] = useState('desktop')
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [publishedAt, setPublishedAt] = useState(null)

  useEffect(() => {
    const { theme } = validateTheme(themeDraft || DEFAULT_THEME)
    setDraft(theme)
  }, [themeDraft])

  const { theme: validated } = useMemo(() => validateTheme(draft), [draft])
  const issues = useMemo(() => contrastIssues(validated), [validated])

  const dirty = JSON.stringify(validated) !== JSON.stringify(validateTheme(themePublished).theme)
  const differsFromDraft = JSON.stringify(validated) !== JSON.stringify(validateTheme(themeDraft).theme)

  const setColor = (modeKey, key, value) => {
    setDraft((current) => ({
      ...current,
      [modeKey]: { ...current[modeKey], [key]: value },
    }))
  }

  const autoFix = (key, background) => {
    if (key !== 'muted' && key !== 'text') return
    setColor(mode, key, readableOn(background))
  }

  const applyPreset = (preset) => {
    if (!window.confirm(`Apply the “${preset.label}” preset to the draft?`)) return
    const { theme } = validateTheme(preset.theme)
    setDraft(theme)
    setNotice(`${preset.label} applied to the draft. Save or publish when you are ready.`)
  }

  const saveDraft = async () => {
    setBusy('draft')
    setError('')
    setNotice('')
    if (contentSource !== 'supabase') {
      setError('Saving requires the configured Supabase backend.')
      setBusy('')
      return
    }
    try {
      await saveSetting('theme_draft', validated)
      setThemes({ draft: validated })
      setNotice('Draft saved. Visitors still see the published theme.')
    } catch (saveError) {
      setError(saveError.message || 'The draft could not be saved.')
    } finally {
      setBusy('')
    }
  }

  const publish = async () => {
    if (issues.length) {
      const proceed = window.confirm(
        `This theme has ${issues.length} contrast warning${issues.length === 1 ? '' : 's'}:\n\n${issues.join('\n')}\n\nPublish anyway?`,
      )
      if (!proceed) return
    }
    setBusy('publish')
    setError('')
    setNotice('')
    if (contentSource !== 'supabase') {
      setError('Publishing requires the configured Supabase backend.')
      setBusy('')
      return
    }
    try {
      await saveSetting('theme_published', validated)
      await saveSetting('theme_draft', validated)
      setThemes({ published: validated, draft: validated })
      setPublishedAt(new Date())
      setNotice('Theme published. Every visitor now sees it.')
    } catch (publishError) {
      setError(publishError.message || 'The theme could not be published.')
    } finally {
      setBusy('')
    }
  }

  const discard = () => {
    const { theme } = validateTheme(themeDraft)
    setDraft(theme)
    setNotice('Unsaved edits discarded.')
  }

  const restorePublished = () => {
    if (!window.confirm('Replace the draft with the currently published theme?')) return
    const { theme } = validateTheme(themePublished)
    setDraft(theme)
    setNotice('Draft now matches the published theme.')
  }

  const resetAll = () => {
    if (!window.confirm('Reset every colour, font and radius to the built-in defaults?')) return
    setDraft(DEFAULT_THEME)
    setNotice('Defaults restored in the draft.')
  }

  // Publishable tokens — used for the local swatch strip.
  const currentPalette = validated[mode]

  return (
    <AdminLayout
      title="Theme & branding"
      eyebrow="APPEARANCE"
      actions={
        <>
          <button type="button" className="button button-secondary button-sm" onClick={saveDraft} disabled={Boolean(busy)}>
            {busy === 'draft' ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
            Save draft
          </button>
          <button type="button" className="button button-primary button-sm" onClick={publish} disabled={Boolean(busy)}>
            {busy === 'publish' ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <UploadCloud size={14} aria-hidden="true" />}
            Publish theme
          </button>
        </>
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

      <div className="theme-status-bar">
        <span className={dirty || differsFromDraft ? 'status-chip dirty' : 'status-chip'}>
          {dirty || differsFromDraft ? 'Draft has unpublished changes' : 'Draft matches the published theme'}
        </span>
        {publishedAt ? <span className="status-chip">Published just now</span> : null}
        <span className="theme-swatch-strip" aria-hidden="true">
          {['bg', 'surface', 'surfaceSoft', 'primary', 'accent', 'text', 'muted'].map((key) => (
            <span key={key} style={{ background: currentPalette[key] }} />
          ))}
        </span>
        <div className="theme-status-actions">
          <button type="button" className="subtle-button" onClick={discard} disabled={!differsFromDraft && !dirty}>
            <X size={13} aria-hidden="true" /> Discard edits
          </button>
          <button type="button" className="subtle-button" onClick={restorePublished}>
            <RotateCcw size={13} aria-hidden="true" /> Match published
          </button>
          <button type="button" className="subtle-button" onClick={resetAll}>
            <Paintbrush size={13} aria-hidden="true" /> Defaults
          </button>
        </div>
      </div>

      <div className="theme-layout">
        <div className="theme-controls">
          <div className="segmented" role="tablist" aria-label="Theme settings">
            {[
              ['colors', 'Colours'],
              ['typography', 'Type & shape'],
              ['presets', 'Presets'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? 'is-active' : ''}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'colors' ? (
            <section className="admin-panel">
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">PALETTE</p>
                  <h2>Edit the {mode} theme</h2>
                </div>
                <div className="segmented compact" role="group" aria-label="Palette to edit">
                  <button type="button" className={mode === 'light' ? 'is-active' : ''} onClick={() => setMode('light')}>
                    <Sun size={13} aria-hidden="true" /> Light
                  </button>
                  <button type="button" className={mode === 'dark' ? 'is-active' : ''} onClick={() => setMode('dark')}>
                    <Moon size={13} aria-hidden="true" /> Dark
                  </button>
                </div>
              </div>

              <p className="field-hint">
                Visitors see the palette that matches their preference. Both palettes are editable, and both are checked
                for contrast.
              </p>

              {COLOR_GROUPS.map((group) => (
                <div className="color-group" key={group}>
                  <h3>{group}</h3>
                  {COLOR_KEYS.filter((item) => item.group === group).map((item) => (
                    <ColorRow
                      key={item.key}
                      mode={mode}
                      item={item}
                      value={validated[mode][item.key]}
                      onChange={(value) => setColor(mode, item.key, value)}
                      onAutoFix={autoFix}
                    />
                  ))}
                </div>
              ))}

              <div className="editor-actions">
                <button
                  type="button"
                  className="subtle-button"
                  onClick={() => setColor(mode, 'bg', DEFAULT_THEME[mode].bg)}
                >
                  <RotateCcw size={13} aria-hidden="true" /> Reset this palette
                </button>
              </div>
            </section>
          ) : null}

          {tab === 'typography' ? (
            <section className="admin-panel">
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">TYPE &amp; SHAPE</p>
                  <h2>Typography, radius and motion</h2>
                </div>
              </div>

              <div className="admin-form-grid">
                <label className="wide-field">
                  Typeface pairing
                  <select
                    value={validated.fontFamily}
                    onChange={(event) => setDraft({ ...validated, fontFamily: event.target.value })}
                  >
                    {FONT_STACKS.map((font) => (
                      <option key={font.key} value={font.key}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                  <small className="field-hint" style={{ fontFamily: fontFor(validated.fontFamily).heading }}>
                    The quick brown fox jumps over the lazy dog.
                  </small>
                </label>

                <label>
                  Typography scale
                  <select value={validated.scale} onChange={(event) => setDraft({ ...validated, scale: event.target.value })}>
                    {SCALE_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Default mode
                  <select value={validated.mode} onChange={(event) => setDraft({ ...validated, mode: event.target.value })}>
                    <option value="system">Follow the visitor&rsquo;s system</option>
                    <option value="light">Always light</option>
                    <option value="dark">Always dark</option>
                  </select>
                </label>

                <label>
                  Corner radius — {validated.radius}px
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={validated.radius}
                    onChange={(event) => setDraft({ ...validated, radius: Number(event.target.value) })}
                  />
                </label>

                <label>
                  Shadow depth — {validated.shadow.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={validated.shadow}
                    onChange={(event) => setDraft({ ...validated, shadow: Number(event.target.value) })}
                  />
                </label>

                <label className="wide-field">
                  Animation intensity — {Math.round(validated.motion * 100)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={validated.motion}
                    onChange={(event) => setDraft({ ...validated, motion: Number(event.target.value) })}
                  />
                  <small className="field-hint">
                    Set to 0 to disable entrance animations. Visitors with a reduced-motion preference always get the
                    static version regardless of this setting.
                  </small>
                </label>
              </div>
            </section>
          ) : null}

          {tab === 'presets' ? (
            <section className="admin-panel">
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">STARTING POINTS</p>
                  <h2>Preset palettes</h2>
                </div>
              </div>
              <div className="preset-grid">
                {THEME_PRESETS.map((preset) => (
                  <button type="button" key={preset.key} className="preset-card" onClick={() => applyPreset(preset)}>
                    <span className="preset-swatches" aria-hidden="true">
                      {['bg', 'surface', 'primary', 'accent', 'text'].map((key) => (
                        <span key={key} style={{ background: preset.theme[preset.theme.mode === 'dark' ? 'dark' : 'light'][key] }} />
                      ))}
                    </span>
                    <strong>{preset.label}</strong>
                    <small>{preset.description}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">ACCESSIBILITY</p>
                <h2>Contrast check</h2>
              </div>
              <Contrast size={18} aria-hidden="true" />
            </div>
            {issues.length ? (
              <ul className="contrast-issues">
                {issues.map((issue) => (
                  <li key={issue}>
                    <AlertTriangle size={13} aria-hidden="true" /> {issue}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="contrast-pass">
                <Check size={14} aria-hidden="true" /> All text and button combinations meet WCAG AA.
              </p>
            )}
          </section>
        </div>

        <LivePreview theme={validated} mode={mode} device={device} onDevice={setDevice} />
      </div>
    </AdminLayout>
  )
}
