import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Inbox, Mail, MailOpen, RefreshCw, Trash2 } from 'lucide-react'
import { deleteMessage, fetchContactMessages, markMessageRead } from '../lib/content'
import { formatDate } from '../lib/format'
import { AdminLayout, SearchField } from './AdminLayout'

export default function MessagesPage() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const messages = await fetchContactMessages()
      setRows(messages)
      setStatus('ready')
    } catch (loadError) {
      setError(loadError.message || 'The inbox could not be read.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => `${row.name} ${row.email} ${row.message}`.toLowerCase().includes(needle))
  }, [rows, query])

  const toggleRead = async (message, read) => {
    setBusyId(message.id)
    try {
      await markMessageRead(message.id, read)
      setRows((current) => current.map((row) => (row.id === message.id ? { ...row, is_read: read } : row)))
    } catch (readError) {
      setError(readError.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return
    setBusyId(message.id)
    try {
      await deleteMessage(message.id)
      setRows((current) => current.filter((row) => row.id !== message.id))
      if (selected?.id === message.id) setSelected(null)
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setBusyId(null)
    }
  }

  const unread = rows.filter((row) => !row.is_read).length

  return (
    <AdminLayout
      title="Messages"
      eyebrow="CONTACT FORM"
      actions={
        <button type="button" className="button button-secondary button-sm" onClick={load} disabled={status === 'loading'}>
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </button>
      }
    >
      {error ? (
        <p className="form-error" role="alert">
          <AlertTriangle size={15} aria-hidden="true" /> {error}
        </p>
      ) : null}

      <div className="admin-split messages-layout">
        <section className="admin-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">INBOX</p>
              <h2>
                {rows.length} messages
                {unread ? <span className="record-count">{unread} unread</span> : null}
              </h2>
            </div>
            <SearchField value={query} onChange={setQuery} placeholder="Search messages…" />
          </div>

          {status === 'loading' ? (
            <p className="admin-muted">Loading…</p>
          ) : filtered.length ? (
            <ul className="message-list">
              {filtered.map((message) => (
                <li key={message.id} className={message.is_read ? '' : 'unread'}>
                  <button type="button" className="message-open" onClick={() => setSelected(message)}>
                    <span className="message-dot" aria-hidden="true" />
                    <div>
                      <strong>{message.name}</strong>
                      <small>{message.email}</small>
                    </div>
                    <time dateTime={message.created_at}>{formatDate(message.created_at, { month: 'short', day: 'numeric' })}</time>
                    <p>{message.message.slice(0, 100)}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="records-empty">
              <Inbox size={22} aria-hidden="true" />
              <p>{query ? 'No messages match that search.' : 'No messages yet.'}</p>
            </div>
          )}
        </section>

        <aside className="admin-panel message-detail">
          {selected ? (
            <>
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">MESSAGE</p>
                  <h2>{selected.name}</h2>
                  <p>
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </p>
                </div>
              </div>

              <p className="message-meta">
                {formatDate(selected.created_at, { dateStyle: 'full', timeStyle: 'short' })}
              </p>

              <div className="message-body">{selected.message}</div>

              <div className="editor-actions stacked">
                <a className="button button-primary" href={`mailto:${selected.email}?subject=Re: your message`}>
                  <Mail size={15} aria-hidden="true" /> Reply by email
                </a>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => toggleRead(selected, !selected.is_read)}
                  disabled={busyId === selected.id}
                >
                  {selected.is_read ? <Mail size={15} aria-hidden="true" /> : <MailOpen size={15} aria-hidden="true" />}
                  {selected.is_read ? 'Mark as unread' : 'Mark as read'}
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={() => remove(selected)}
                  disabled={busyId === selected.id}
                >
                  <Trash2 size={15} aria-hidden="true" /> Delete
                </button>
              </div>

              {selected.is_read ? (
                <p className="field-hint">
                  <Check size={12} aria-hidden="true" /> Read
                </p>
              ) : null}
            </>
          ) : (
            <div className="records-empty">
              <MailOpen size={22} aria-hidden="true" />
              <p>Select a message to read it.</p>
            </div>
          )}
        </aside>
      </div>
    </AdminLayout>
  )
}
