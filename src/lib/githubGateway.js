// GitHub-only publishing. The write token is entered by the administrator at
// sign-in and kept only in sessionStorage; it is never bundled into the site.
const OWNER = 'maheshdave-builds'
const REPO = 'maheshdave-builds.github.io'
const BRANCH = 'main'
const CONTENT_PATH = 'public/portfolio-content.json'
const ARTICLES_PATH = 'public/articles-content.json'
const ARTICLE_LIKES_PATH = 'public/article-likes.json'
const SESSION_KEY = 'portfolio-github-admin-session'
const API = 'https://api.github.com'
const RAW_CONTENT_URL = '/portfolio-content.json'
const RAW_ARTICLES_URL = '/articles-content.json'
const RAW_GITHUB_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/public`
const RAW_CONTENT_GITHUB = `${RAW_GITHUB_BASE}/portfolio-content.json`
const RAW_ARTICLES_GITHUB = `${RAW_GITHUB_BASE}/articles-content.json`
const LOCAL_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const LOCAL_DEV_KEY = 'portfolio-content-local-preview'
const LOCAL_DEV_ARTICLES_KEY = 'portfolio-articles-local-preview'
const LOCAL_DEV_LIKES_KEY = 'portfolio-article-likes-local-preview'

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
  // Production reads the committed JSON on main, not the last Pages build artifact.
  // Admin publish updates main immediately; waiting for CI left visitors on stale data.
  const portfolioUrl = LOCAL_DEV ? `${RAW_CONTENT_URL}?v=${version}` : `${RAW_CONTENT_GITHUB}?v=${version}`
  const articlesUrl = LOCAL_DEV ? `${RAW_ARTICLES_URL}?v=${version}` : `${RAW_ARTICLES_GITHUB}?v=${version}`
  const [portfolioResponse, articlesResponse] = await Promise.all([
    fetch(portfolioUrl, { cache: 'no-store' }),
    fetch(articlesUrl, { cache: 'no-store' }),
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

function jsonFileBytes(value) {
  return new TextEncoder().encode(JSON.stringify(value, null, 2) + '\n')
}

async function createBlob(token, bytes) {
  const response = await fetch(`${API}/repos/${OWNER}/${REPO}/git/blobs`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: encodeBase64(bytes), encoding: 'base64' }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || `Could not create Git blob (${response.status}).`)
  return result.sha
}

/** One commit for all content files so Publish triggers a single Pages deploy. */
async function commitContentFiles(token, message, files) {
  const refResponse = await fetch(`${API}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, { headers: headers(token), cache: 'no-store' })
  const refData = await refResponse.json().catch(() => ({}))
  if (!refResponse.ok) throw new Error(refData.message || `Could not read ${BRANCH} ref (${refResponse.status}).`)

  const parentSha = refData.object?.sha
  if (!parentSha) throw new Error('Could not resolve the current branch commit.')

  const parentCommitResponse = await fetch(`${API}/repos/${OWNER}/${REPO}/git/commits/${parentSha}`, { headers: headers(token), cache: 'no-store' })
  const parentCommit = await parentCommitResponse.json().catch(() => ({}))
  if (!parentCommitResponse.ok) throw new Error(parentCommit.message || `Could not read parent commit (${parentCommitResponse.status}).`)

  const treeItems = []
  for (const file of files) {
    const sha = await createBlob(token, jsonFileBytes(file.content))
    treeItems.push({ path: file.path, mode: '100644', type: 'blob', sha })
  }

  const treeResponse = await fetch(`${API}/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: treeItems }),
  })
  const tree = await treeResponse.json().catch(() => ({}))
  if (!treeResponse.ok) throw new Error(tree.message || `Could not build Git tree (${treeResponse.status}).`)

  const commitResponse = await fetch(`${API}/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
  })
  const commit = await commitResponse.json().catch(() => ({}))
  if (!commitResponse.ok) throw new Error(commit.message || `Could not create commit (${commitResponse.status}).`)

  const updateRef = async () => fetch(`${API}/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  let refUpdate = await updateRef()
  if (refUpdate.status === 422 || refUpdate.status === 409) {
    refUpdate = await updateRef()
  }
  const refResult = await refUpdate.json().catch(() => ({}))
  if (!refUpdate.ok) throw new Error(refResult.message || `Could not update ${BRANCH} (${refUpdate.status}).`)
  return commit
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
    if (payload.articleLikes) localStorage.setItem(LOCAL_DEV_LIKES_KEY, JSON.stringify(payload.articleLikes))
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
  const { articles: _stagedArticles, articleLikes, ...portfolio } = payload
  const files = [
    { path: ARTICLES_PATH, content: { articles } },
    { path: CONTENT_PATH, content: portfolio },
  ]
  if (articleLikes) files.push({ path: ARTICLE_LIKES_PATH, content: articleLikes })

  const commit = await commitContentFiles(token, `Publish site content ${new Date().toISOString()}`, files)
  return { ok: true, commit: commit.sha, updated_at: commit.committer?.date || new Date().toISOString() }
}
