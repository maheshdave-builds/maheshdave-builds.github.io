import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, BookOpen, Copy, Linkedin, Play, Pause, Square, Volume2, Facebook, ChevronDown, Check, LoaderCircle, Headphones } from 'lucide-react'
import { useContent } from '../contexts/hooks'
import { Link } from '../lib/RouterLink'
import { TextLink } from '../components/Button'
import CinematicSlider from '../components/CinematicSlider'
import { absoluteUrl, useSeo, SITE_ORIGIN } from '../lib/useSeo'
import { formatDate, isArticlePublic, readingTime, sortArticles, truncate } from '../lib/format'
import { sanitizeHtml, toPlainText } from '../lib/sanitize'
import { fetchArticleBySlug, contentSource } from '../lib/content'
import { getArticleCoverImage } from '../lib/articleImages'

function useArticle(slug) {
  const { articles, status } = useContent()
  const normalizedSlug = decodeURIComponent(String(slug || '')).replace(/\/$/, '')
  const fromList = articles.find((article) => decodeURIComponent(String(article.slug || '')).replace(/\/$/, '') === normalizedSlug) || null
  // Fetch outcome is stored together with the slug it belongs to, so a stale
  // result for a previous slug can never be shown as the current article.
  const [fetched, setFetched] = useState({ slug: null, article: null })

  useEffect(() => {
    // The home query may not include every article (it is capped) or the visitor
    // may have landed directly on the permalink, so a direct fetch fills the gap.
    if (fromList || status === 'loading' || contentSource === 'local') return undefined

    let active = true
    fetchArticleBySlug(slug)
      .then((article) => {
        if (active) setFetched({ slug, article })
      })
      .catch(() => {
        if (active) setFetched({ slug, article: null })
      })

    return () => {
      active = false
    }
  }, [slug, fromList, status])

  if (fromList) return { article: fromList, loading: false }

  const resolved = fetched.slug === slug ? fetched.article : null
  const waiting = contentSource !== 'local' && status !== 'local' && !fromList && fetched.slug !== slug

  return { article: resolved, loading: waiting }
}

export default function ArticlePage({ slug }) {
  const { articles, site } = useContent()
  const { article, loading } = useArticle(slug)
  const [copied, setCopied] = useState(false)
  const [voices, setVoices] = useState([])
  const [voiceName, setVoiceName] = useState('')
  const [speechRate, setSpeechRate] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const [speechMessage, setSpeechMessage] = useState('')
  const [listenExpanded, setListenExpanded] = useState(false)
  const [speechBusy, setSpeechBusy] = useState(false)
  const speechQueueRef = useRef([])
  const speechIndexRef = useRef(0)
  const bodyRef = useRef(null)

  const html = useMemo(() => (article ? sanitizeHtml(article.content) : ''), [article])
  const visible = article && isArticlePublic(article) ? article : null


  useEffect(() => {
    if (!('speechSynthesis' in window)) { setSpeechMessage('Text-to-speech is not supported in this browser.'); return undefined }
    const update = () => {
      const available = window.speechSynthesis.getVoices().filter(voice => voice.lang && voice.name)
      setVoices(available)
      setVoiceName(current => available.some(voice => voice.name === current) ? current : (available.find(voice => /^en(-|_)/i.test(voice.lang)) || available[0])?.name || '')
      if (!available.length) setSpeechMessage('No system voices available. Enable a voice in device settings.')
      else setSpeechMessage('Ready to listen')
    }
    update(); window.speechSynthesis.addEventListener?.('voiceschanged', update)
    return () => { window.speechSynthesis.removeEventListener?.('voiceschanged', update); window.speechSynthesis.cancel() }
  }, [])

  const speechText = useMemo(() => visible ? `${visible.title}. ${visible.excerpt || ''}. ${toPlainText(visible.content)}`.replace(/\s+/g, ' ').trim() : '', [visible])
  const speechChunks = (text) => {
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/g) || [text]
    const chunks = []; let current = ''
    for (const sentence of sentences) {
      if ((current + ' ' + sentence).length > 220 && current) { chunks.push(current.trim()); current = sentence }
      else current += ` ${sentence}`
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks
  }
  const speak = () => {
    if (!('speechSynthesis' in window)) { setSpeechMessage('Text-to-speech is not supported in this browser.'); return }
    if (!voices.length) { setSpeechMessage('No supported voices found. Enable a text-to-speech voice in device settings and retry.'); setListenExpanded(true); return }
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) { window.speechSynthesis.pause(); setSpeaking(false); setSpeechMessage('Paused'); return }
    if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setSpeaking(true); setSpeechMessage('Playing'); return }
    const voice = voices.find(item => item.name === voiceName)
    if (!voice) { setSpeechMessage('Choose an available language/voice first.'); setListenExpanded(true); return }
    window.speechSynthesis.cancel()
    speechQueueRef.current = speechChunks(speechText); speechIndexRef.current = 0
    setSpeechBusy(true); setSpeechMessage('Starting playback…'); setListenExpanded(true)
    const playNext = () => {
      if (speechIndexRef.current >= speechQueueRef.current.length) { setSpeaking(false); setSpeechBusy(false); setSpeechMessage('Finished'); return }
      const utterance = new SpeechSynthesisUtterance(speechQueueRef.current[speechIndexRef.current++])
      utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = speechRate
      utterance.onstart = () => { setSpeaking(true); setSpeechBusy(false); setSpeechMessage(`Playing · ${voice.lang}`) }
      utterance.onend = playNext
      utterance.onerror = (event) => { if (event.error === 'canceled' || event.error === 'interrupted') return; setSpeaking(false); setSpeechBusy(false); setSpeechMessage(`Playback failed (${event.error || 'speech error'}). Try another voice.`) }
      window.speechSynthesis.speak(utterance)
    }
    playNext()
  }
  const stopSpeech = () => { window.speechSynthesis?.cancel(); speechQueueRef.current = []; speechIndexRef.current = 0; setSpeaking(false); setSpeechBusy(false); setSpeechMessage('Stopped') }
  const articleUrl = visible?.slug ? absoluteUrl(`/articles/${encodeURIComponent(visible.slug)}`) : ''
  const shareOn = (platform) => {
    const encodedUrl = encodeURIComponent(articleUrl); const encodedTitle = encodeURIComponent(visible?.title || '')
    const urls = { x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` }
    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=640,height=560')
  }
  const copyArticleLink = async () => { try { await navigator.clipboard.writeText(articleUrl); setCopied(true); setTimeout(() => setCopied(false), 2200) } catch { setCopied(false) } }

  useEffect(() => {
    const root = bodyRef.current
    if (!root) return undefined

    const copyText = async (text) => {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return
      }
      // Fallback for browsers/webviews where Clipboard API is unavailable.
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      area.style.pointerEvents = 'none'
      document.body.appendChild(area)
      area.select()
      const succeeded = document.execCommand('copy')
      area.remove()
      if (!succeeded) throw new Error('Clipboard copy was rejected')
    }

    const addCopyControls = () => {
        root.querySelectorAll('pre, blockquote').forEach((block) => {
        // Put the control outside <pre>: its horizontal overflow can otherwise
        // clip/scroll the button along with the code on narrow screens.
        let wrapper = block.parentElement
        if (!wrapper?.classList.contains('article-copy-wrapper')) {
          wrapper = document.createElement('div')
          wrapper.className = 'article-copy-wrapper'
          block.parentNode.insertBefore(wrapper, block)
          wrapper.appendChild(block)
        }
        if (wrapper.querySelector('.article-copy-control')) return
        // Re-apply wrapper styling after CMS HTML updates; code blocks can be nested in markdown wrappers.
        wrapper.classList.add('article-copy-wrapper')
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'article-copy-control'
        button.setAttribute('aria-label', block.tagName === 'PRE' ? 'Copy code' : 'Copy quote')
        button.title = button.getAttribute('aria-label')
        button.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>'
        button.addEventListener('click', async () => {
          const code = block.tagName === 'PRE' ? (block.querySelector('code')?.textContent ?? block.textContent ?? '') : (block.innerText || block.textContent || '')
          try {
            await copyText(code)
            button.classList.add('is-copied')
            button.title = 'Copied!'
            button.setAttribute('aria-label', 'Copied!')
            button.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>'
            window.setTimeout(() => {
              if (!button.isConnected) return
              button.classList.remove('is-copied')
              button.title = block.tagName === 'PRE' ? 'Copy code' : 'Copy quote'
              button.setAttribute('aria-label', button.title)
              button.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>'
            }, 1800)
          } catch {
            button.title = 'Copy failed — select the code and copy manually'
            button.setAttribute('aria-label', button.title)
            button.classList.add('copy-failed')
            window.setTimeout(() => button.classList.remove('copy-failed'), 2400)
          }
        })
        wrapper.appendChild(button)
        })
      }


    // Initialize existing code blocks and keep controls attached if article HTML
    // is replaced or inserted after the initial render (e.g. CMS-rendered content).
    addCopyControls()
    const contentObserver = new MutationObserver(() => addCopyControls())
    contentObserver.observe(root, { childList: true, subtree: true })

    root.querySelectorAll('a[href]').forEach((link) => {
      if (link.querySelector('.article-external-icon') || !/^https?:/i.test(link.href)) return
      const icon = document.createElement('span'); icon.className = 'article-external-icon'; icon.setAttribute('aria-hidden', 'true'); icon.innerHTML = ' ↗'; link.appendChild(icon)
    })
    return () => contentObserver.disconnect()
  }, [html, visible?.slug])

  const moreArticles = useMemo(() => {
    if (!visible) return []
    const currentSlug = decodeURIComponent(String(visible.slug || '')).replace(/\/$/, '')
    return sortArticles(
      articles.filter((item) => {
        if (!isArticlePublic(item)) return false
        const itemSlug = decodeURIComponent(String(item.slug || '')).replace(/\/$/, '')
        if (itemSlug === currentSlug) return false
        if (visible.id && item.id && String(item.id) === String(visible.id)) return false
        return true
      }),
    )
  }, [articles, visible])

  useSeo({
    title: visible ? `${visible.seo_title || visible.title} — ${site.siteTitle}` : 'Article not found — Mahesh Dave',
    description:
      visible?.seo_description ||
      (visible ? truncate(visible.excerpt || toPlainText(visible.content), 155) : 'This article could not be found.'),
    image: visible ? getArticleCoverImage(visible) : '/social-share.png',
    canonicalPath: visible?.canonical_url || `/articles/${encodeURIComponent(slug)}`,
    type: 'article',
    noindex: !visible,
    jsonLd: visible
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: visible.title,
          description: visible.seo_description || visible.excerpt,
          datePublished: visible.published_at,
          dateModified: visible.updated_at || visible.published_at,
          author: { '@type': 'Person', name: visible.author || 'Mahesh Dave' },
          publisher: { '@type': 'Person', name: 'Mahesh Dave', url: SITE_ORIGIN },
          mainEntityOfPage: absoluteUrl(`/articles/${visible.slug}`),
          image: absoluteUrl(getArticleCoverImage(visible)),
          keywords: visible.tags?.join(', '),
        }
      : null,
    jsonLdId: 'article-jsonld',
  })

  const share = async () => {
    const url = articleUrl || absoluteUrl(`/articles/${encodeURIComponent(slug)}`)
    try {
      if (navigator.share) {
        await navigator.share({ title: visible?.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* the visitor cancelled or the clipboard is blocked — nothing to report */
    }
  }

  if (loading) {
    return (
      <main id="main" className="article-shell">
        <div className="article-main article-skeleton" aria-busy="true" aria-label="Loading article">
          <span className="skeleton-line short" />
          <span className="skeleton-line title" />
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line medium" />
        </div>
      </main>
    )
  }

  if (!visible) {
    return (
      <main id="main" className="article-shell">
        <div className="article-main article-missing">
          <BookOpen size={26} aria-hidden="true" />
          <h1>Article not found</h1>
          <p>
            This article may have been unpublished, renamed, or the link may be incorrect. Published notes are listed
            on the portfolio.
          </p>
          <Link className="button button-primary" to="/articles">
            <ArrowLeft size={16} aria-hidden="true" /> All Articles
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main id="main" className="article-shell">
      <article className="article-main">
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link to="/articles">
            <ArrowLeft size={14} aria-hidden="true" /> All Articles
          </Link>
        </nav>

        <header className="article-heading">
          <p className="eyebrow">
            {visible.category || 'Engineering notes'}
            {visible.published_at ? ` · ${formatDate(visible.published_at)}` : ''} · {readingTime(visible.content)} min
            read
          </p>
          <h1>{visible.title}</h1>
          {visible.excerpt ? <p className="article-excerpt">{visible.excerpt}</p> : null}
          <div className="article-audio-share-row">
            {site.copy?.articleListenEnabled !== false ? <section className={`article-listen ${listenExpanded ? 'is-expanded' : ''}`} aria-label="Audio Experience">
              <div className="article-listen-title"><Headphones className="audio-experience-heading-icon" size={20} strokeWidth={2} aria-hidden="true"/><div><strong>Audio Experience</strong>{speechMessage ? <small role="status">{speechMessage}</small> : null}</div><button type="button" className="listen-play-icon" onClick={speak} aria-label={speaking ? 'Pause article' : 'Play article audio'}>{speechBusy ? <LoaderCircle size={18} className="spin"/> : speaking ? <Pause size={18}/> : <Play size={18}/>}</button><button type="button" className="listen-expand-toggle" onClick={() => setListenExpanded(value => !value)} aria-expanded={listenExpanded} aria-label={listenExpanded ? 'Collapse listening controls' : 'Expand listening controls'}><ChevronDown size={18}/></button></div>
              {listenExpanded ? <div className="article-listen-controls"><button type="button" className="button button-primary" onClick={speak}>{speaking ? <Pause size={16}/> : <Play size={16}/>} {speaking ? 'Pause' : window.speechSynthesis?.paused ? 'Resume' : 'Play'}</button><button type="button" className="button button-secondary" onClick={stopSpeech}><Square size={14}/> Stop</button><label>Language / voice<select value={voiceName} onChange={e => setVoiceName(e.target.value)}>{voices.map(voice => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.lang} — {voice.name}</option>)}</select></label><label>Speed<select value={speechRate} onChange={e => setSpeechRate(Number(e.target.value))}>{[0.75,1,1.25,1.5,2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label>{!voices.length ? <p className="field-hint" role="status">No system voices are available. Enable a voice in your device or browser settings, then reload this page.</p> : null}</div> : null}
            </section> : <div className="article-listen-disabled-spacer" />}
            <div className="article-actions" aria-label="Article sharing">
              <button type="button" className="subtle-button article-share" onClick={() => shareOn('x')} aria-label="Share on X" title="Share on X"><span aria-hidden="true" className="x-share-icon">𝕏</span></button>
              <button type="button" className="subtle-button article-share" onClick={() => shareOn('linkedin')} aria-label="Share on LinkedIn" title="Share on LinkedIn"><Linkedin size={17}/></button>
              <button type="button" className="subtle-button article-share" onClick={() => shareOn('facebook')} aria-label="Share on Facebook" title="Share on Facebook"><Facebook size={17}/></button>
              <button type="button" className={`subtle-button article-share ${copied ? 'is-copied' : ''}`} onClick={copyArticleLink} aria-label={copied ? 'Article link copied' : 'Copy article link'} title={copied ? 'Copied!' : 'Copy article link'}>{copied ? <Check size={17}/> : <Copy size={17}/>}</button>
            </div>
          </div>
        </header>

        <img
          className="article-cover"
          src={getArticleCoverImage(visible)}
          alt=""
          width="1200"
          height="630"
          decoding="async"
        />

        <div ref={bodyRef} className="article-body" dangerouslySetInnerHTML={{ __html: html }} />

        {visible.tags?.length ? (
          <div className="article-tags" aria-label="Tags">
            {visible.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}

        <footer className="article-footer">
          <p>
            Written by <strong>{visible.author || 'Mahesh Dave'}</strong>
          </p>
          <TextLink href={`mailto:${site.contactEmail}`}>Discuss this article</TextLink>
        </footer>
      </article>

      {moreArticles.length ? (
        <aside className="article-related" aria-labelledby="more-articles-title">
          <h2 id="more-articles-title">More Articles</h2>
          <CinematicSlider
            intervalSeconds={site.sliderIntervalSeconds ?? 5}
            label="More Articles"
            items={moreArticles}
            getTitle={(article) => article.title}
            getImage={getArticleCoverImage}
            getLink={(article) => `/articles/${encodeURIComponent(article.slug)}`}
            renderDetails={(article, _index, primary) => primary ? (
              <>
                <p className="cinema-summary">{article.excerpt || truncate(toPlainText(article.content), 160)}</p>
                <p className="cinema-meta">
                  {article.category || 'ENGINEERING NOTES'}
                  {article.published_at ? ` · ${formatDate(article.published_at)}` : ''}
                  {' · '}
                  {readingTime(article.content)} min read
                </p>
                <Link className="cinema-link" to={`/articles/${encodeURIComponent(article.slug)}`}>
                  Read article <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </>
            ) : null}
          />
        </aside>
      ) : null}
    </main>
  )
}
