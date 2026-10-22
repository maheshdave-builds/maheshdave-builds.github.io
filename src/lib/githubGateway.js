// GitHub-only publishing. The write token is entered by the administrator at
// sign-in and kept only in sessionStorage; it is never bundled into the site.
const OWNER = 'maheshdave-builds'
const REPO = 'maheshdave-builds.github.io'
const BRANCH = 'main'
const CONTENT_PATH = 'public/portfolio-content.json'
const SESSION_KEY = 'portfolio-github-admin-session'
const API = 'https://api.github.com'
const RAW_CONTENT_URL = '/portfolio-content.json'

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
async function readPublicContent() {
  const response = await fetch(`${RAW_CONTENT_URL}?v=${Date.now()}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Could not load published portfolio content (${response.status}).`)
  return response.json()
}
export async function gatewayRequest(path = '', options = {}) {
  if (options.method === 'GET' || !options.method) return readPublicContent()
  if (options.method !== 'PUT') throw new Error('Unsupported GitHub content operation.')
  const token = getGatewayPassword()
  if (!token) throw new Error('Your GitHub session expired. Sign in again before saving.')
  const endpoint = `${API}/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}`
  let payload
  try { payload = JSON.parse(options.body || '{}') } catch { throw new Error('Portfolio content is not valid JSON.') }
  const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2))
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  const encodedContent = btoa(binary)

  // GitHub requires the latest blob SHA when replacing a file. A second
  // administrator tab or a commit from GitHub can make the first SHA stale
  // between GET and PUT, which produces a "does not match" conflict. Refresh
  // the SHA and retry once; never reuse a stale SHA.
  let lastMessage = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const currentResponse = await fetch(`${endpoint}?ref=${BRANCH}&_=${Date.now()}`, { headers: headers(token), cache: 'no-store' })
    const current = await currentResponse.json().catch(() => ({}))
    if (!currentResponse.ok && currentResponse.status !== 404) {
      throw new Error(current.message || `Could not read the GitHub content file (${currentResponse.status}).`)
    }
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { ...headers(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Publish portfolio content ${new Date().toISOString()}`, content: encodedContent, branch: BRANCH, ...(current.sha ? { sha: current.sha } : {}) })
    })
    const result = await response.json().catch(() => ({}))
    if (response.ok) return { ok: true, commit: result.commit?.sha, updated_at: result.commit?.committer?.date || new Date().toISOString() }
    lastMessage = result.message || `GitHub rejected the update (${response.status}).`
    const conflict = response.status === 409 || (response.status === 422 && /sha|match|conflict/i.test(lastMessage))
    if (!conflict || attempt === 1) {
      if (conflict) throw new Error('The published content changed on GitHub while you were saving. Your edits were not published. Please reload the admin page to get the latest content, reapply your changes if needed, and publish again.')
      throw new Error(`${lastMessage} Check that your token has Contents: Read and write access and that the main branch allows direct commits.`)
    }
  }
  throw new Error(lastMessage || 'GitHub publishing failed. Please try again.')
}
