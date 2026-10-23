// HTML sanitizer for admin-authored article content.
//
// Built on the browser's own HTML parser rather than regexes: the string is
// parsed into an inert document (which never executes scripts or loads remote
// resources), unknown elements are unwrapped, disallowed attributes are
// dropped, and the remaining tree is re-serialized. This replaces the previous
// `safeHtml` helper, which only stripped `<script>` tags and on* attributes and
// was bypassable with e.g. `<svg onload>` or `<img src=x onerror=...>`.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
])

// Elements whose *contents* are also unsafe and must be removed entirely,
// including anything nested inside them.
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'applet', 'noscript',
  'svg', 'math', 'template', 'form', 'input', 'button', 'select', 'option',
  'textarea', 'link', 'meta', 'base', 'title', 'head',
])

const ALLOWED_ATTRS = {
  '*': new Set(['class', 'title']),
  a: new Set(['href', 'rel', 'target', 'class', 'title']),
  span: new Set(['style']),
  img: new Set(['src', 'alt', 'width', 'height', 'class', 'title']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
}

const SAFE_URL = /^(https?:|mailto:|tel:)/i
const SAFE_IMAGE_DATA = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i
const RELATIVE = /^(\/|\.\/|\.\.\/|#)/

function isSafeUrl(value, { image = false } = {}) {
  const url = String(value || '').trim()
  if (!url) return false
  // Remove control characters and whitespace before protocol matching, so
  // "java\nscript:" cannot slip through. Char-code filtering avoids a control
  // character range in the regular expression.
  let collapsed = ''
  for (const char of url) {
    const code = char.codePointAt(0)
    if (code > 0x1f && code !== 0x7f && !/\s/.test(char)) collapsed += char
  }
  if (/^(javascript|vbscript|data|file):/i.test(collapsed)) {
    if (image && SAFE_IMAGE_DATA.test(url)) return true
    return false
  }
  if (SAFE_URL.test(collapsed)) return true
  if (RELATIVE.test(collapsed)) return true
  return false
}

function sanitizeNode(node, doc) {
  // Text nodes pass through unescaped-verbatim; serialization escapes them.
  if (node.nodeType === Node.TEXT_NODE) return doc.createTextNode(node.nodeValue)

  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const tag = node.tagName.toLowerCase()
  if (DROP_WITH_CONTENT.has(tag)) return null

  const children = []
  for (const child of Array.from(node.childNodes)) {
    const clean = sanitizeNode(child, doc)
    if (clean) children.push(clean)
  }

  if (!ALLOWED_TAGS.has(tag)) {
    // Unknown but harmless wrapper: keep its text, discard the element.
    const fragment = doc.createDocumentFragment()
    children.forEach((child) => fragment.appendChild(child))
    return fragment
  }

  let element
  try {
    element = doc.createElement(tag)
  } catch {
    return null
  }

  const allowed = ALLOWED_ATTRS[tag] || new Set()
  const common = ALLOWED_ATTRS['*']

  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase()
    const value = attr.value
    if (name.startsWith('on') || name === 'srcdoc') continue
    if (name === 'style') {
      if (tag !== 'span') continue
      const colorStyle = value.match(/^\s*color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\))\s*;?\s*$/i)
      const backgroundStyle = value.match(/^\s*background-color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([0-9.,%\s]+\)|hsla?\([0-9.,%\s]+\))\s*;?\s*$/i)
      if (colorStyle || backgroundStyle) element.setAttribute('style', (colorStyle || backgroundStyle)[0].trim())
      continue
    }
    if (!allowed.has(name) && !common.has(name)) continue

    if (name === 'href' && !isSafeUrl(value)) continue
    if (name === 'src' && !isSafeUrl(value, { image: true })) continue
    if (name === 'target') {
      if (value !== '_blank' && value !== '_self') continue
    }
    if (name === 'class') {
      // Only allow classes the reader styles rely on; strip everything else.
      const safe = value.split(/\s+/).filter((c) => /^[a-z0-9_-]+$/i.test(c)).join(' ')
      if (safe) element.setAttribute('class', safe)
      continue
    }

    try {
      element.setAttribute(name, value)
    } catch {
      /* invalid attribute name — skip */
    }
  }

  // Any link opening a new tab must be isolated from the opener.
  if (tag === 'a' && element.getAttribute('target') === '_blank') {
    element.setAttribute('rel', 'noopener noreferrer nofollow')
  }

  children.forEach((child) => element.appendChild(child))
  return element
}

/**
 * Return HTML that is safe to place in `dangerouslySetInnerHTML`.
 * Falls back to escaped plain text if the DOM is unavailable (SSR/tests).
 */
export function sanitizeHtml(html) {
  const input = String(html ?? '')
  if (!input.trim()) return ''
  if (typeof DOMParser === 'undefined') return escapeText(input)

  const parsed = new DOMParser().parseFromString(`<body>${input}</body>`, 'text/html')
  const output = document.implementation.createHTMLDocument('')
  const body = output.createElement('body')

  for (const child of Array.from(parsed.body.childNodes)) {
    const clean = sanitizeNode(child, output)
    if (clean) body.appendChild(clean)
  }

  return body.innerHTML
}

/** Strip all markup — used for excerpts, meta descriptions and search text. */
export function toPlainText(html) {
  const input = String(html ?? '')
  if (!input) return ''
  if (typeof DOMParser === 'undefined') return input.replace(/<[^>]*>/g, ' ')
  const parsed = new DOMParser().parseFromString(`<body>${input}</body>`, 'text/html')
  return (parsed.body.textContent || '').replace(/\s+/g, ' ').trim()
}

function escapeText(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
