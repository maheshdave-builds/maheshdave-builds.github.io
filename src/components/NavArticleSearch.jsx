import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CircleX, Search } from 'lucide-react'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { useRouter } from '../lib/routerCore'
import { isArticlePublic, sortArticles, truncate } from '../lib/format'
import { toPlainText } from '../lib/sanitize'
import { articleMatchesQuery, articlesPathWithQuery, readArticleQuery } from '../lib/articleSearch'

const SUGGESTION_LIMIT = 6

function suggestionRank(article, needle) {
  const title = String(article.title || '').toLocaleLowerCase()
  if (title.startsWith(needle)) return 0
  if (title.includes(needle)) return 1
  return 2
}

export default function NavArticleSearch({ menuOpen = false, onInteract }) {
  const { articles: sourceArticles = [], status = 'ready' } = useContent()
  const { pathname, search, navigate } = useRouter()
  const urlQuery = useMemo(() => readArticleQuery(search), [search])
  const [query, setQuery] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [panelPath, setPanelPath] = useState(pathname)
  const [menuSnapshot, setMenuSnapshot] = useState(menuOpen)

  if (menuOpen !== menuSnapshot) {
    setMenuSnapshot(menuOpen)
    if (menuOpen) {
      setOpen(false)
      setExpanded(false)
    }
  }

  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery)
    setQuery(urlQuery)
  }

  if (panelPath !== pathname) {
    setPanelPath(pathname)
    setOpen(false)
    setExpanded(false)
    setActiveIndex(-1)
  }
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()
  const inputId = useId()

  const articles = useMemo(
    () => sortArticles(sourceArticles.filter((article) => isArticlePublic(article))),
    [sourceArticles],
  )

  const suggestions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return []
    return articles
      .filter((article) => articleMatchesQuery(article, needle))
      .sort((a, b) => suggestionRank(a, needle) - suggestionRank(b, needle) || String(a.title).localeCompare(String(b.title)))
      .slice(0, SUGGESTION_LIMIT)
  }, [articles, query])

  const matchCount = useMemo(() => {
    const needle = query.trim()
    if (!needle) return 0
    return articles.filter((article) => articleMatchesQuery(article, needle)).length
  }, [articles, query])

  useEffect(() => {
    if (!open && !expanded) return undefined
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setExpanded(false)
      }
    }
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setExpanded(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, expanded])

  const showSuggestions = (open || expanded) && Boolean(query.trim())
  const optionCount = suggestions.length + (query.trim() ? 1 : 0)

  const goToResults = () => {
    const next = articlesPathWithQuery(query, pathname === '/articles' ? search : '')
    setOpen(false)
    setExpanded(false)
    setActiveIndex(-1)
    if (`${pathname}${search || ''}` !== next) navigate(next, { replace: pathname === '/articles' })
  }

  const applyLiveQuery = (value) => {
    setQuery(value)
    setActiveIndex(-1)
    setOpen(true)
    if (pathname === '/articles') {
      const next = articlesPathWithQuery(value, search)
      if (`${pathname}${search || ''}` !== next) navigate(next, { replace: true })
    }
  }

  const clearQuery = () => {
    applyLiveQuery('')
    inputRef.current?.focus()
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (optionCount ? (index + 1) % optionCount : -1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (optionCount ? (index <= 0 ? optionCount - 1 : index - 1) : -1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        const article = suggestions[activeIndex]
        setOpen(false)
        setExpanded(false)
        navigate(`/articles/${encodeURIComponent(article.slug)}`)
        return
      }
      goToResults()
    }
  }

  return (
    <div className={`nav-article-search${expanded ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="nav-article-search-toggle"
        aria-label={expanded ? 'Close article search' : 'Search articles'}
        aria-expanded={expanded}
        aria-controls={inputId}
        onClick={() => {
          onInteract?.()
          setExpanded((value) => {
            const next = !value
            if (next) {
              setOpen(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            } else setOpen(false)
            return next
          })
        }}
      >
        {expanded ? <CircleX size={17} aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}
      </button>

      <form
        className="nav-article-search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          goToResults()
        }}
      >
        <label className="articles-search" htmlFor={inputId}>
          <Search size={18} className="articles-search-icon" aria-hidden="true" />
          <input
            id={inputId}
            ref={inputRef}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
            value={query}
            placeholder="Search Articles..."
            autoComplete="off"
            enterKeyHint="search"
            onChange={(event) => applyLiveQuery(event.target.value)}
            onFocus={() => {
              onInteract?.()
              if (query.trim()) setOpen(true)
            }}
            onKeyDown={onKeyDown}
          />
          {query.trim() ? (
            <button type="button" className="articles-search-clear" onClick={clearQuery} aria-label="Clear search" title="Clear search">
              <CircleX size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </label>
      </form>

      {showSuggestions ? (
        <div className="nav-article-search-results" id={listId} role="listbox" aria-label="Article suggestions" onMouseDown={(event) => event.preventDefault()}>
          {status === 'loading' ? <p className="nav-article-search-empty">Loading published articles…</p> : null}
          {status !== 'loading' && suggestions.length === 0 ? (
            <p className="nav-article-search-empty">No matching articles. Search includes the full article text, not only titles.</p>
          ) : null}
          {suggestions.map((article, index) => (
            <Link
              key={article.id || article.slug}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              className={`nav-article-search-option${activeIndex === index ? ' is-active' : ''}`}
              to={`/articles/${encodeURIComponent(article.slug)}`}
              onClick={() => {
                setOpen(false)
                setExpanded(false)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="nav-article-search-meta">{article.category || 'Engineering notes'}</span>
              <strong>{article.title}</strong>
              <span>{truncate(toPlainText(article.excerpt || article.content || ''), 110)}</span>
            </Link>
          ))}
          <button
            type="button"
            id={`${listId}-option-${suggestions.length}`}
            role="option"
            aria-selected={activeIndex === suggestions.length}
            className={`nav-article-search-all${activeIndex === suggestions.length ? ' is-active' : ''}`}
            onClick={goToResults}
            onMouseEnter={() => setActiveIndex(suggestions.length)}
          >
            {matchCount ? `View all ${matchCount} matching article${matchCount === 1 ? '' : 's'}` : 'Search articles'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
