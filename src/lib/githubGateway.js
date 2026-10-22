const API_URL = (import.meta.env.VITE_GITHUB_CONTENT_API_URL || '').replace(/\/$/, '')
const SESSION_KEY = 'portfolio-github-admin-session'

export function githubGatewayConfigured() { return Boolean(API_URL) }
export function getGatewayPassword() { try { return sessionStorage.getItem(SESSION_KEY) || '' } catch { return '' } }
export async function authenticateGateway(password) {
  if (!API_URL) throw new Error('GitHub admin gateway is not configured. Set VITE_GITHUB_CONTENT_API_URL in GitHub Actions and deploy again.')
  const response = await fetch(`${API_URL}/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.ok) throw new Error(result.error || 'Admin sign-in failed.')
  try { sessionStorage.setItem(SESSION_KEY, password) } catch {}
  return { access_token: password, user: { id: 'github-admin', email: 'admin@portfolio.local', app_metadata: { role: 'admin' } } }
}
export function clearGatewaySession() { try { sessionStorage.removeItem(SESSION_KEY) } catch {} }
export async function gatewayRequest(path = '', options = {}) {
  if (!API_URL) throw new Error('GitHub admin gateway is not configured.')
  const password = getGatewayPassword()
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(options.headers || {}), ...(password ? { Authorization: `Bearer ${password}` } : {}) } })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || `GitHub gateway request failed (${response.status}).`)
  return result
}
