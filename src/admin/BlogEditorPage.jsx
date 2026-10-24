import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  Save,
  Send,
  Trash2,
  Undo2,
  Palette,
} from 'lucide-react'
import { Link } from '../lib/RouterLink'
import { useRouter } from '../lib/routerCore'
import { useAdminContent } from '../contexts/hooks'
import { deleteRecord, saveRecord, uploadImage } from '../lib/content'
import { formatDate, fromDateTimeLocal, readingTime, slugify, toDateTimeLocal, truncate } from '../lib/format'
import { sanitizeHtml, toPlainText } from '../lib/sanitize'
import { AdminLayout, SearchField } from './AdminLayout'
import ImageCropDialog from './ImageCropDialog'

function blankPost() {
  return {
    id: null,
    title: '',
    slug: '',
    category: 'Engineering notes',
    excerpt: '',
    content: '',
    cover_image_url: '',
    status: 'draft',
    published_at: '',
    author: 'Mahesh Dave',
    tags: [],
    seo_title: '',
    seo_description: '',
    canonical_url: '',
  }
}

const TOOLBAR = [
  [
    ['B', 'bold', 'Bold'],
    ['I', 'italic', 'Italic'],
    ['U', 'underline', 'Underline'],
    ['S̶', 'strikeThrough', 'Strikethrough'],
    ['Mark', 'hiliteColor', 'Highlight', '#fff0a6'],
  ],
  [
    ['H2', 'formatBlock', 'Heading 2', 'h2'],
    ['H3', 'formatBlock', 'Heading 3', 'h3'],
    ['P', 'formatBlock', 'Paragraph', 'p'],
  ],
  [
    ['• List', 'insertUnorderedList', 'Bulleted list'],
    ['1. List', 'insertOrderedList', 'Numbered list'],
    ['Quote', 'formatBlock', 'Block quote', 'blockquote'],
    ['Code', 'insertHTML', 'Code block', '<pre><code>Write code here</code></pre>'],
  ],
  [
    ['Align left', 'justifyLeft', 'Align left'],
    ['Center', 'justifyCenter', 'Center text'],
    ['Align right', 'justifyRight', 'Align right'],
    ['HR', 'insertHorizontalRule', 'Horizontal rule'],
    ['Link', 'createLink', 'Insert link'],
    ['Unlink', 'unlink', 'Remove link'],
  ],
  [
    ['↶', 'undo', 'Undo'],
    ['↷', 'redo', 'Redo'],
  ],
]

/**
 * Rich-text editor. The editable surface is uncontrolled and synced to React on
 * input, because rewriting innerHTML on every keystroke moves the caret. The
 * value is sanitized on save and again on render, so the DB never stores markup
 * the public site would refuse to display.
 */
function RichText({ value, onChange }) {
  const ref = useRef(null)
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [textColor, setTextColor] = useState('#2563eb')

  useEffect(() => {
    // Only reset the DOM when the editor is mounted for a different article,
    // tracked via data-seeded rather than compared on every render.
    if (ref.current && ref.current.dataset.seeded !== 'true') {
      ref.current.innerHTML = sanitizeHtml(value || '')
      ref.current.dataset.seeded = 'true'
    }
  }, [value])

  const exec = (command, arg) => {
    ref.current?.focus()
    if (command === 'insertHTML') {
      document.execCommand('insertHTML', false, arg)
    } else if (command === 'foreColor' || command === 'hiliteColor') {
      document.execCommand('styleWithCSS', false, true)
      document.execCommand(command, false, arg)
    } else if (command === 'createLink') {
      const url = window.prompt('Link URL (https://…)')
      if (!url) return
      if (!/^https?:\/\//i.test(url)) {
        window.alert('Links must start with http:// or https://')
        return
      }
      document.execCommand('createLink', false, url)
    } else if (command === 'formatBlock') {
      document.execCommand('formatBlock', false, `<${arg}>`)
    } else {
      document.execCommand(command, false, arg)
    }
    sync()
  }

  const sync = () => {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const insertImage = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'articles')
      ref.current?.focus()
      document.execCommand('insertImage', false, url)
      sync()
    } catch (error) {
      window.alert(error.message || 'The image could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="wysiwyg">
      <div className="rich-toolbar" role="toolbar" aria-label="Formatting">
        {TOOLBAR.map((group, index) => (
          <div className="rich-toolbar-group" key={index}>
            {group.map(([label, command, title, arg]) => (
              <button
                key={label}
                type="button"
                title={title}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => exec(command, arg)}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
        <label className="rich-color-control" title="Text color"><Palette size={13} aria-hidden="true" /><input type="color" value={textColor} onChange={(event) => { setTextColor(event.target.value); exec('foreColor', event.target.value) }} aria-label="Text color" /></label>
        <button type="button" className="toolbar-upload" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 size={13} className="spin" aria-hidden="true" /> : <ImagePlus size={13} aria-hidden="true" />}
          {uploading ? 'Uploading' : 'Image'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            insertImage(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      <div
        ref={ref}
        className="wysiwyg-canvas"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article content"
        data-placeholder="Write the article…"
        onInput={sync}
        onBlur={sync}
        onPaste={(event) => {
          const clipboard = event.clipboardData
          const html = clipboard?.getData('text/html')
          const plain = clipboard?.getData('text/plain') || ''
          // Pasting raw HTML source (rather than rich text copied from a page)
          // should render the markup in the editor instead of displaying tags.
          if (!html && /<\/?[a-z][^>]*>/i.test(plain)) {
            event.preventDefault()
            document.execCommand('insertHTML', false, sanitizeHtml(plain))
            sync()
          }
        }}
      />
    </div>
  )
}

function PreviewDialog({ post, onClose }) {
  const html = useMemo(() => sanitizeHtml(post.content), [post.content])

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="dialog article-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-heading">
          <div>
            <p className="eyebrow">PREVIEW · {post.status === 'published' ? 'PUBLISHED' : 'DRAFT'}</p>
            <h2 id="preview-title">How this will read</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close preview">
            <ArrowLeft size={16} />
          </button>
        </header>
        <div className="dialog-body">
          <article className="article-preview">
            <p className="eyebrow">
              {post.category} · {readingTime(post.content)} min read
            </p>
            <h1>{post.title || 'Untitled article'}</h1>
            {post.excerpt ? <p className="article-excerpt">{post.excerpt}</p> : null}
            {post.cover_image_url ? <img src={post.cover_image_url} alt="" /> : null}
            <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        </div>
      </div>
    </div>
  )
}

export default function BlogEditorPage({ mode, recordId }) {
  const { posts, reload, loading: contentLoading } = useAdminContent()
  const { navigate } = useRouter()
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(blankPost)
  const [baseline, setBaseline] = useState(() => JSON.stringify(blankPost()))
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [coverCropFile, setCoverCropFile] = useState(null)

  const editing = mode === 'edit'
  const record = editing ? posts.find((post) => String(post.id) === String(recordId)) : null

  useEffect(() => {
    const next = record
      ? {
          ...blankPost(),
          ...record,
          tags: Array.isArray(record.tags) ? record.tags.join(', ') : '',
          published_at: toDateTimeLocal(record.published_at),
        }
      : blankPost()
    setForm(next)
    setBaseline(JSON.stringify(next))
    setSlugTouched(Boolean(record))
    setNotice('')
    setError('')
  }, [record])

  const dirty = JSON.stringify(form) !== baseline

  useEffect(() => {
    if (!dirty) return undefined
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const change = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'title' && !slugTouched) next.slug = slugify(value)
      return next
    })
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return posts
    return posts.filter((post) => `${post.title} ${post.category} ${post.status}`.toLowerCase().includes(needle))
  }, [posts, query])

  const save = async (status) => {
    setError('')
    setNotice('')

    if (!String(form.title).trim()) {
      setError('An article needs a title.')
      return
    }

    const content = sanitizeHtml(form.content)
    if (!toPlainText(content).trim()) {
      setError('Write some article content before saving.')
      return
    }

    const slug = slugify(form.slug || form.title)
    if (!slug) {
      setError('The title does not produce a usable URL slug. Set one manually.')
      return
    }

    const publishedAt = status === 'published' ? fromDateTimeLocal(form.published_at) || new Date().toISOString() : fromDateTimeLocal(form.published_at)
    const duplicate = posts.find((post) => post.slug === slug && String(post.id) !== String(form.id))
    if (duplicate) {
      setError(`Another article already uses the slug “${slug}”.`)
      return
    }

    const payload = {
      ...form,
      slug,
      status,
      content,
      published_at: publishedAt,
      tags: String(form.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    setBusy(true)
    try {
      const saved = await saveRecord('posts', payload)
      await reload()
      const savedForm = { ...payload, ...saved, tags: Array.isArray(saved?.tags) ? saved.tags.join(', ') : payload.tags.join(', '), published_at: toDateTimeLocal(saved?.published_at || publishedAt) }
      setForm(savedForm)
      setBaseline(JSON.stringify(savedForm))
      setNotice(status === 'published' ? 'Article status saved as published. Click Publish in the header to deploy it.' : 'Draft saved locally. Click Publish in the header to deploy it.')
      if (saved?.id && String(saved.id) !== String(form.id)) {
        navigate(`/mdadmin/blog/${saved.id}`, { replace: true })
      }
    } catch (saveError) {
      setError(saveError.message || 'The article could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!form.id) return
    if (!window.confirm(`Delete “${form.title}”? This removes the article permanently.`)) return
    setBusy(true)
    try {
      await deleteRecord('posts', form.id)
      await reload()
      navigate('/mdadmin/blog', { replace: true })
    } catch (deleteError) {
      setError(deleteError.message || 'The article could not be deleted.')
    } finally {
      setBusy(false)
    }
  }

  if (editing && !record && contentLoading) {
    return <AdminLayout title="Loading article…" eyebrow="ARTICLES"><div className="admin-loading" role="status">Loading article details…</div></AdminLayout>
  }

  if (editing && !record) {
    return (
      <AdminLayout title="Article not found" eyebrow="ARTICLES">
        <div className="admin-error">
          <h2>That article no longer exists</h2>
          <Link className="button button-secondary" to="/mdadmin/blog">
            Back to articles
          </Link>
        </div>
      </AdminLayout>
    )
  }

  if (mode === 'list') {
    return (
      <AdminLayout
        title="Articles"
        eyebrow="BLOG"
        counts={{ posts: posts.length }}
        actions={
          <Link className="button button-primary button-sm" to="/mdadmin/blog/new">
            <FileText size={15} aria-hidden="true" /> New article
          </Link>
        }
      >
        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">CONTENT LIBRARY</p>
              <h2>
                All articles <span className="record-count">{posts.length}</span>
              </h2>
            </div>
            <SearchField value={query} onChange={setQuery} placeholder="Search articles…" />
          </div>

          {filtered.length ? (
            <ul className="record-list">
              {filtered.map((post) => {
                const scheduled = post.status === 'published' && post.published_at && new Date(post.published_at) > new Date()
                return (
                  <li key={post.id}>
                    <span className={`record-status ${post.status}`}>{post.status === 'published' ? (scheduled ? 'scheduled' : 'live') : 'draft'}</span>
                    <div className="record-info">
                      <strong>
                        <Link to={`/mdadmin/blog/${post.id}`}>{post.title}</Link>
                      </strong>
                      <small>
                        /blog/{post.slug} · {readingTime(post.content)} min read
                        {post.published_at ? ` · ${formatDate(post.published_at)}` : ''}
                      </small>
                    </div>
                    <div className="record-actions">
                      {post.status === 'published' && !scheduled ? (
                        <Link className="record-action" to={`/blog/${encodeURIComponent(post.slug)}?preview=local`} aria-label="Preview article" target="_blank" rel="noreferrer">
                          <Eye size={14} />
                        </Link>
                      ) : null}
                      <Link className="record-action" to={`/mdadmin/blog/${post.id}`} aria-label="Edit article">
                        <FileText size={14} />
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="records-empty">
              <FileText size={22} aria-hidden="true" />
              <p>{query ? 'No articles match that search.' : 'No articles yet. The first one starts with a title.'}</p>
              {!query ? (
                <Link className="button button-secondary button-sm" to="/mdadmin/blog/new">
                  Write the first article
                </Link>
              ) : null}
            </div>
          )}
        </section>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={editing ? 'Edit article' : 'New article'}
      eyebrow="BLOG"
      counts={{ posts: posts.length }}
      actions={
        <>
          <button type="button" className="button button-secondary button-sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={15} aria-hidden="true" /> Preview
          </button>
          <Link className="button button-secondary button-sm" to="/mdadmin/blog">
            <ArrowLeft size={15} aria-hidden="true" /> Back
          </Link>
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

      <div className="blog-editor">
        <div className="blog-editor-main">
          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">ARTICLE</p>
                <h2>{editing ? 'Content' : 'Draft a new article'}</h2>
              </div>
              {dirty ? <span className="unsaved-pill">Unsaved changes</span> : null}
            </div>

            <label className="field-block">
              Title
              <input
                className="title-input"
                value={form.title}
                onChange={(event) => change('title', event.target.value)}
                placeholder="A clear, specific headline"
              />
            </label>

            <label className="field-block">
              Slug
              <div className="slug-input">
                <span>/blog/</span>
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    change('slug', event.target.value)
                  }}
                  onBlur={() => change('slug', slugify(form.slug || form.title))}
                  placeholder="article-url"
                />
              </div>
              <small className="field-hint">Changing a published slug breaks existing links. Set a canonical URL if you do.</small>
            </label>

            <div className="field-block">
              <span className="field-label">Body</span>
              <RichText
                key={form.id || 'new'}
                value={form.content}
                onChange={(html) => change('content', html)}
              />
              <small className="field-hint">
                {readingTime(form.content)} min read · {toPlainText(form.content).split(/\s+/).filter(Boolean).length} words
              </small>
            </div>
          </section>

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">SEARCH &amp; SHARING</p>
                <h2>SEO metadata</h2>
              </div>
            </div>
            <div className="admin-form-grid">
              <label className="wide-field">
                SEO title
                <input
                  value={form.seo_title}
                  onChange={(event) => change('seo_title', event.target.value)}
                  placeholder={form.title || 'Defaults to the article title'}
                  maxLength={70}
                />
                <small className="field-hint">{70 - form.seo_title.length} characters left</small>
              </label>
              <label className="wide-field">
                Meta description
                <textarea
                  rows={3}
                  value={form.seo_description}
                  onChange={(event) => change('seo_description', event.target.value)}
                  placeholder={truncate(form.excerpt || toPlainText(form.content), 155)}
                  maxLength={170}
                />
                <small className="field-hint">{170 - form.seo_description.length} characters left</small>
              </label>
              <label className="wide-field">
                Canonical URL
                <input
                  type="url"
                  value={form.canonical_url}
                  onChange={(event) => change('canonical_url', event.target.value)}
                  placeholder="Leave empty unless this article was published elsewhere first"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="blog-editor-side">
          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">PUBLISHING</p>
                <h2>{form.status === 'published' ? 'Published' : 'Draft'}</h2>
              </div>
            </div>

            <label className="field-block">
              Category
              <input value={form.category} onChange={(event) => change('category', event.target.value)} />
            </label>

            <label className="field-block">
              Tags
              <input
                value={form.tags}
                onChange={(event) => change('tags', event.target.value)}
                placeholder="Adobe Commerce, GraphQL, Performance"
              />
              <small className="field-hint">Comma separated.</small>
            </label>

            <label className="field-block">
              Author
              <input value={form.author} onChange={(event) => change('author', event.target.value)} />
            </label>

            <label className="field-block">
              <Clock size={13} aria-hidden="true" /> Publish date
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(event) => change('published_at', event.target.value)}
              />
              <small className="field-hint">A future date schedules publication.</small>
            </label>

            <div className="editor-actions stacked">
              <button type="button" className="button button-primary" onClick={() => save('published')} disabled={busy}>
                {busy ? <Loader2 size={15} className="spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
                {busy ? 'Saving…' : form.status === 'published' ? 'Update published article' : 'Publish'}
              </button>
              <button type="button" className="button button-secondary" onClick={() => save('draft')} disabled={busy}>
                <Save size={15} aria-hidden="true" /> {form.status === 'published' ? 'Unpublish to draft' : 'Save draft'}
              </button>
              {form.id ? (
                <button type="button" className="button button-danger" onClick={remove} disabled={busy}>
                  <Trash2 size={15} aria-hidden="true" /> Delete article
                </button>
              ) : null}
            </div>
          </section>

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">COVER IMAGE</p>
                <h2>Featured image</h2>
              </div>
            </div>
            <div className="cover-field">
              {form.cover_image_url ? <img src={form.cover_image_url} alt="" /> : <span className="cover-empty">No cover image</span>}
              <label className="field-block">
                Image URL
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={(event) => change('cover_image_url', event.target.value)}
                  placeholder="https://…"
                />
              </label>
              <button
                type="button"
                className="subtle-button"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = async () => {
                    const file = input.files?.[0]
                    if (!file) return
                    setCoverCropFile(file)
                  }
                  input.click()
                }}
              >
                <ImagePlus size={14} aria-hidden="true" /> Upload cover
              </button>
            </div>
          </section>

          <section className="admin-panel">
            <div className="editor-heading">
              <div>
                <p className="eyebrow">EXCERPT</p>
                <h2>Summary</h2>
              </div>
            </div>
            <textarea
              rows={4}
              value={form.excerpt}
              onChange={(event) => change('excerpt', event.target.value)}
              placeholder="One or two sentences shown on the blog index."
            />
          </section>
        </aside>
      </div>

      {previewOpen ? <PreviewDialog post={form} onClose={() => setPreviewOpen(false)} /> : null}
      <ImageCropDialog file={coverCropFile} aspectRatio="16 / 9" title="Crop article cover" onCancel={() => setCoverCropFile(null)} onApply={async (croppedFile) => { try { const url = await uploadImage(croppedFile, 'articles'); change('cover_image_url', url); setCoverCropFile(null) } catch (uploadError) { setError(uploadError.message || 'Could not upload cropped cover.') } }} />
    </AdminLayout>
  )
}
