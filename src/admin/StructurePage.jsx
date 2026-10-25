import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Link2, Plus, Save, Trash2, Layers3, Check, Loader2 } from 'lucide-react'
import { useAdminContent } from '../contexts/hooks'
import { saveSetting } from '../lib/content'
import { NAV_ITEMS } from '../lib/navigation'
import { AdminLayout } from './AdminLayout'

const DEFAULT_ORDER = ['home', 'about', 'projects', 'experience', 'certifications', 'education', 'expertise', 'blog', 'contact']
const SECTION_LABELS = {
  home: 'Hero / intro', about: 'About', projects: 'Projects', experience: 'Experience',
  certifications: 'Certifications', education: 'Education', expertise: 'Toolkit / expertise', blog: 'Blog / notes', contact: 'Contact',
}
const makeId = () => `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export default function StructurePage() {
  const { site, setSite } = useAdminContent()
  const structure = site.structure || {}
  const [order, setOrder] = useState(() => [...new Set([...(structure.order || DEFAULT_ORDER), ...DEFAULT_ORDER, ...(site.customSections || []).map((section) => section.id)])])
  const [hidden, setHidden] = useState(structure.hidden || [])
  const [menu, setMenu] = useState(site.navigationLinks || NAV_ITEMS.map((item) => ({ ...item })))
  const [menuStyle, setMenuStyle] = useState(site.menuStyle || 'underline')
  const [customSections, setCustomSections] = useState(site.customSections || [])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const dirty = useMemo(() => JSON.stringify({ order, hidden, menu, menuStyle, customSections }) !== JSON.stringify({ order: structure.order || DEFAULT_ORDER, hidden: structure.hidden || [], menu: site.navigationLinks || NAV_ITEMS, menuStyle: site.menuStyle || 'underline', customSections: site.customSections || [] }), [order, hidden, menu, menuStyle, customSections, structure.order, structure.hidden, site.navigationLinks, site.menuStyle, site.customSections])

  const move = (index, direction) => setOrder((current) => {
    const next = [...current]
    const target = index + direction
    if (target < 0 || target >= next.length) return current
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  const addSection = () => { const section = { id: makeId(), title: 'New section', body: 'Add your section content here.', visible: true }; setCustomSections((current) => [...current, section]); setOrder((current) => [...current, section.id]) }
  const updateCustom = (id, patch) => setCustomSections((current) => current.map((section) => section.id === id ? { ...section, ...patch } : section))
  const addMenu = () => setMenu((current) => [...current, { label: 'New menu item', href: '#contact', visible: true }])
  const updateMenu = (index, patch) => setMenu((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item))
  const moveMenu = (index, direction) => setMenu((current) => {
    const next = [...current]
    const target = index + direction
    if (target < 0 || target >= next.length) return current
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })

  const save = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      const nextSite = { ...site, menuStyle, structure: { order, hidden }, navigationLinks: menu.filter((item) => item.label.trim() && item.href.trim()), customSections }
      await saveSetting('site_structure', { structure: nextSite.structure, navigationLinks: nextSite.navigationLinks, customSections: nextSite.customSections, menuStyle: nextSite.menuStyle })
      setSite(nextSite)
      setNotice('Page structure and navigation saved.')
    } catch (saveError) { setError(saveError.message || 'Could not save page structure.') }
    finally { setBusy(false) }
  }

  return (
    <AdminLayout title="Page structure" eyebrow="LAYOUT & NAVIGATION" actions={<button className="button button-primary button-sm" type="button" disabled={!dirty || busy} onClick={save}>{busy ? <Loader2 size={15} className="spin" /> : <Save size={15} />}{busy ? 'Saving…' : 'Save structure'}</button>}>
      {notice && <p className="form-notice"><Check size={15} /> {notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="admin-page-note">Control the public page without editing code. Use the arrows to change section order; the eye icon hides or shows a section. Menu labels and links are editable separately.</p>
      <section className="admin-panel structure-panel">
        <div className="editor-heading"><div><p className="eyebrow">PAGE BUILDER</p><h2>Homepage sections</h2><p>Reorder, hide or show the built-in sections.</p></div><Layers3 size={22} /></div>
        <div className="structure-list">
          {order.map((id, index) => {
            const label = SECTION_LABELS[id] || customSections.find((section) => section.id === id)?.title || id
            const isHidden = hidden.includes(id) || (customSections.find((section) => section.id === id)?.visible === false)
            return <div className={`structure-row ${isHidden ? 'is-hidden' : ''}`} key={id}>
              <GripVertical size={17} className="grip" />
              <span className="structure-index">{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
              <div className="structure-actions">
                <button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
                <button type="button" aria-label={`Move ${label} down`} disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
                <button type="button" aria-label={`${isHidden ? 'Show' : 'Hide'} ${label}`} onClick={() => {
                  if (SECTION_LABELS[id]) setHidden((current) => isHidden ? current.filter((key) => key !== id) : [...current, id])
                  else updateCustom(id, { visible: isHidden })
                }}>{isHidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
          })}
        </div>
      </section>

      <section className="admin-panel structure-panel">
        <div className="editor-heading"><div><p className="eyebrow">CUSTOM CONTENT</p><h2>Custom page sections</h2><p>Add a new section with a heading and text, then place it in the order above.</p></div><button type="button" className="button button-secondary button-sm" onClick={addSection}><Plus size={15} /> Add section</button></div>
        {customSections.length === 0 && <p className="field-hint">No custom sections yet. Add one to introduce services, case studies, testimonials or any other content.</p>}
        {customSections.map((section) => <div className="custom-section-editor" key={section.id}>
          <label>Section title<input value={section.title} onChange={(event) => updateCustom(section.id, { title: event.target.value })} /></label>
          <label>Section content<textarea rows={4} value={section.body} onChange={(event) => updateCustom(section.id, { body: event.target.value })} /></label>
          <p className="field-hint">Section anchor: <code>#{section.id}</code> — use this value in a menu link to jump directly to this section.</p>
          <div className="custom-section-footer"><label className="inline-check"><input type="checkbox" checked={section.visible !== false} onChange={(event) => updateCustom(section.id, { visible: event.target.checked })} /> Visible on public site</label><button type="button" className="record-action danger" aria-label="Delete custom section" onClick={() => { setCustomSections((current) => current.filter((item) => item.id !== section.id)); setOrder((current) => current.filter((id) => id !== section.id)) }}><Trash2 size={15} /></button></div>
        </div>)}
      </section>

      <section className="admin-panel structure-panel">
        <div className="editor-heading"><div><p className="eyebrow">PRIMARY NAVIGATION</p><h2>Menu items</h2><p>Change labels and destinations, control visibility, and use the arrows to set the public menu order.</p></div><button type="button" className="button button-secondary button-sm" onClick={addMenu}><Plus size={15} /> Add menu item</button></div>
        <label className="field-block menu-style-picker">Navigation style
          <select value={menuStyle} onChange={(event) => setMenuStyle(event.target.value)}>
            <option value="underline">Animated underline</option>
            <option value="pill">Floating pill</option>
            <option value="minimal">Minimal text</option>
            <option value="glow">Soft glow</option>
          </select>
          <small className="field-hint">Choose how the public header menu is presented. The current selection is saved with the site structure.</small>
        </label>
        <div className="menu-editor-list">
          {menu.map((item, index) => <div className="menu-editor-row" key={`${index}-${item.label}`}>
            <div className="menu-position-controls" aria-label={`Position ${index + 1}`}>
              <Link2 size={16} className="grip" />
              <span className="structure-index">{String(index + 1).padStart(2, '0')}</span>
              <button type="button" className="structure-icon-button" aria-label={`Move ${item.label} up`} title="Move up" disabled={index === 0} onClick={() => moveMenu(index, -1)}><ArrowUp size={14} /></button>
              <button type="button" className="structure-icon-button" aria-label={`Move ${item.label} down`} title="Move down" disabled={index === menu.length - 1} onClick={() => moveMenu(index, 1)}><ArrowDown size={14} /></button>
            </div>
            <label>Menu label<input value={item.label} onChange={(event) => updateMenu(index, { label: event.target.value })} /></label>
            <label>Link / section ID<input value={item.href} onChange={(event) => updateMenu(index, { href: event.target.value })} placeholder="#projects or https://example.com" /></label>
            <div className="menu-row-actions"><button type="button" className="structure-icon-button" aria-label={`${item.visible === false ? 'Show' : 'Hide'} ${item.label} menu item`} onClick={() => updateMenu(index, { visible: item.visible === false })}>{item.visible === false ? <EyeOff size={15} /> : <Eye size={15} />}</button><button type="button" className="record-action danger" aria-label="Remove menu item" onClick={() => setMenu((current) => current.filter((_, i) => i !== index))}><Trash2 size={15} /></button></div>
          </div>)}
        </div>
        <p className="field-hint">Use #about or #projects for sections, /articles/slug for articles, or a full https:// URL for an external link.</p>
      </section>
    </AdminLayout>
  )
}
