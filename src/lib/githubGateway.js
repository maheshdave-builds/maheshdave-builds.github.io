// GitHub-only publishing. The write token is entered by the administrator at
// sign-in and kept only in sessionStorage; it is never bundled into the site.
const OWNER = 'maheshdave-builds'
const REPO = 'maheshdave-builds.github.io'
const BRANCH = 'main'
const CONTENT_PATH = 'public/portfolio-content.json'
const ARTICLES_PATH = 'public/articles-content.json'
const SESSION_KEY = 'portfolio-github-admin-session'
const API = 'https://api.github.com'
const RAW_CONTENT_URL = '/portfolio-content.json'
const RAW_ARTICLES_URL = '/articles-content.json'
const LOCAL_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const LOCAL_DEV_KEY = 'portfolio-content-local-preview'
const LOCAL_DEV_ARTICLES_KEY = 'portfolio-articles-local-preview'

export function githubGatewayConfigured() { return true }
export function getGatewayPassword() { try { return sessionStorage.getItem(SESSION_KEY) || '' } catch { return '' } }
export async function authenticateGateway(token) {
  const candidate = String(token || '').trim()
  if (!candidate) throw new Error('Enter a GitHub fine-grained personal access token.')
  const response = await fetch(`${API}/repos/${OWNER}/${REPO}`, { headers: { Authorization: `Bearer ${candidate}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } })
  const repo = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(response.status === 401 ? 'GitHub token is invalid or expired.' : response.status === 403 ? 'Token lacks access. Grant Contents: Read and write for this repository.' : repo.message || `GitHub validation failed (${response.status}).`)
  if (!repo.permissions?.push && repo.permissions?.admin !== true) throw new Error('This token cannot write to the repository. Grant Contents: Read and write.')
  try { sessionStorage.setItem(SESSION_KEY, candidate) } catch { throw new Error('Could not keep the token for this browser session. Enable session storage and retry.') }
  return { access_token: candidate, user: { id: 'github-admin', email: 'github-admin', app_metadata: { role: 'admin' } } }
}
export function clearGatewaySession() { try { sessionStorage.removeItem(SESSION_KEY) } catch {} }
function headers(token = getGatewayPassword()) {
  return { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}
function mergeArticlePayload(portfolio, articlePayload) {
  const { articles: _embedded, ...rest } = portfolio || {}
  const articles = Array.isArray(articlePayload?.articles) ? articlePayload.articles : []
  return { ...rest, articles }
}

async function readPublicContent() {
  const version = Date.now()
  const [portfolioResponse, articlesResponse] = await Promise.all([
    fetch(`${RAW_CONTENT_URL}?v=${version}`, { cache: 'no-store' }),
    fetch(`${RAW_ARTICLES_URL}?v=${version}`, { cache: 'no-store' }),
  ])
  if (!portfolioResponse.ok) throw new Error(`Could not load published portfolio content (${portfolioResponse.status}).`)
  if (!articlesResponse.ok) throw new Error(`Could not load published articles (${articlesResponse.status}).`)
  const [portfolio, articlePayload] = await Promise.all([portfolioResponse.json(), articlesResponse.json()])
  if (!portfolio || typeof portfolio !== 'object' || !articlePayload || !Array.isArray(articlePayload.articles)) {
    throw new Error('Published content JSON has an invalid schema.')
  }

  const published = { ...portfolio, articles: articlePayload.articles }

  // Local admin preview uses staged Publish output only when both files were written
  // and the staged snapshot actually contains articles. Empty staged copies must not
  // hide articles that exist in public/articles-content.json.
  if (LOCAL_DEV) {
    try {
      const draft = localStorage.getItem(LOCAL_DEV_KEY)
      const articlesDraft = localStorage.getItem(LOCAL_DEV_ARTICLES_KEY)
      if (draft && articlesDraft) {
        const staged = mergeArticlePayload(JSON.parse(draft), JSON.parse(articlesDraft))
        if (Array.isArray(staged.articles) && staged.articles.length) return staged
      }
    } catch { /* keep fetched public files */ }
  }

  return published
}
async function getGitHubFile(endpoint, token) {
  const response = await fetch(`${endpoint}?ref=${BRANCH}&t=${Date.now()}`, { headers: headers(token), cache: 'no-store' })
  const result = await response.json().catch(() => ({}))
  if (!response.ok && response.status !== 404) throw new Error(result.message || `Could not read the GitHub file (${response.status}).`)
  return result
}

function encodeBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  return btoa(binary)
}

export async function uploadGitHubMedia(file, folder = 'uploads') {
  if (LOCAL_DEV) {
    if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Choose a valid image file.')
    if (file.size > 2 * 1024 * 1024) throw new Error('For local preview, use an image smaller than 2 MB.')
    return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
  }
  const token = getGatewayPassword()
  if (!token) throw new Error('Your GitHub session expired. Sign in again before uploading media.')
  if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Choose a valid image file.')
  if (file.size > 8 * 1024 * 1024) throw new Error('Please use an image smaller than 8 MB so GitHub can publish it reliably.')
  const safeFolder = String(folder || 'uploads').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'uploads'
  const extFromName = (String(file.name || '').split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const extFromType = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif' })[file.type] || 'img'
  const ext = extFromName || extFromType
  const path = `public/uploads/${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const endpoint = `${API}/repos/${OWNER}/${REPO}/contents/${path}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const response = await fetch(endpoint, { method: 'PUT', headers: { ...headers(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Upload portfolio media ${path}`, content: encodeBase64(bytes), branch: BRANCH }) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || `GitHub rejected the media upload (${response.status}).`)
  return `/uploads/${safeFolder}/${path.split('/').pop()}`
}

export async function gatewayRequest(path = '', options = {}) {
  if (LOCAL_DEV && options.method === 'PUT') {
    let payload
    try { payload = JSON.parse(options.body || '{}') } catch { throw new Error('Portfolio content is not valid JSON.') }
    const articles = Array.isArray(payload.articles) ? payload.articles : []
    const { articles: _articles, ...portfolio } = payload
    localStorage.setItem(LOCAL_DEV_KEY, JSON.stringify(portfolio))
    localStorage.setItem(LOCAL_DEV_ARTICLES_KEY, JSON.stringify({ articles }))
    window.dispatchEvent(new Event('portfolio-local-content-updated'))
    return { ok: true, localPreview: true, updated_at: new Date().toISOString() }
  }
  if (options.method === 'GET' || !options.method) return readPublicContent()
  if (options.method !== 'PUT') throw new Error('Unsupported GitHub content operation.')
  const token = getGatewayPassword()
  if (!token) throw new Error('Your GitHub session expired. Sign in again before saving.')
  let payload
  try { payload = JSON.parse(options.body || '{}') } catch { throw new Error('Portfolio content is not valid JSON.') }
  const now = Date.now()
  // The JSON file is public on GitHub Pages: never publish drafts or future-dated content into it.
  const articles = (Array.isArray(payload.articles) ? payload.articles : []).filter((article) => {
    if (String(article?.status || '').trim().toLowerCase() !== 'published') return false
    if (!article.published_at) return true
    const publishedAt = Date.parse(article.published_at)
    return Number.isFinite(publishedAt) && publishedAt <= now
  })
  const { articles: _stagedArticles, ...portfolio } = payload
  async function writeFile(path, value) {
    const endpoint = `${API}/repos/${OWNER}/${REPO}/contents/${path}`
    const content = encodeBase64(new TextEncoder().encode(JSON.stringify(value, null, 2) + '\n'))
    let lastError
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const current = await getGitHubFile(endpoint, token)
      const response = await fetch(endpoint, { method: 'PUT', headers: { ...headers(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Publish ${path} ${new Date().toISOString()}`, content, branch: BRANCH, ...(current.sha ? { sha: current.sha } : {}) }) })
      const result = await response.json().catch(() => ({}))
      if (response.ok) return result
      lastError = new Error(result.message || `GitHub rejected ${path} (${response.status}).`)
      if (attempt === 0 && (response.status === 409 || response.status === 422) && /sha|conflict|does not match|already exists/i.test(result.message || '')) continue
      throw lastError
    }
    throw lastError || new Error(`Could not publish ${path}.`)
  }
  // Both files are committed independently; surface failures rather than falsely reporting publication.
  await writeFile(ARTICLES_PATH, { articles })
  const result = await writeFile(CONTENT_PATH, portfolio)
  return { ok: true, commit: result.commit?.sha, updated_at: result.commit?.committer?.date || new Date().toISOString() }
}
