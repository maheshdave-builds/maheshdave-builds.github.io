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
  const currentResponse = await fetch(`${endpoint}?ref=${BRANCH}`, { headers: headers(token) })
  const current = await currentResponse.json().catch(() => ({}))
  if (!currentResponse.ok && currentResponse.status !== 404) throw new Error(current.message || `Could not read the GitHub content file (${currentResponse.status}).`)
  let payload
  try { payload = JSON.parse(options.body || '{}') } catch { throw new Error('Portfolio content is not valid JSON.') }
  const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2))
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  const response = await fetch(endpoint, { method: 'PUT', headers: { ...headers(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Publish portfolio content ${new Date().toISOString()}`, content: btoa(binary), branch: BRANCH, ...(current.sha ? { sha: current.sha } : {}) }) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || `GitHub rejected the update (${response.status}). Check token permissions and repository branch protection.`)
  return { ok: true, commit: result.commit?.sha, updated_at: result.commit?.committer?.date || new Date().toISOString() }
}
