// Small REST adapter for Supabase's Auth and PostgREST APIs. Authorization is
// enforced by PostgreSQL RLS; the anon key is public by design and never
// privileged. No service-role key belongs in this file or anywhere else in the
// client bundle.
//
// This deliberately does not depend on @supabase/supabase-js: the surface the
// site needs (password sign-in, refresh-token rotation, password recovery) is
// small, and keeping it explicit makes the trust boundary easy to audit.

const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const isConfigured = Boolean(url && anonKey)

const SESSION_KEY = 'portfolio-supabase-session'
const REFRESH_MARGIN_SECONDS = 60

let currentSession = null
let refreshPromise = null
const listeners = new Set()

try {
  const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  // Discard a session that expired while the tab was closed instead of sending
  // it and waiting for a 401 on the first protected request.
  if (stored?.access_token) currentSession = stored
} catch {
  currentSession = null
}

function persist(session) {
  currentSession = session
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage disabled (private mode) — session lives in memory for this tab */
  }
  listeners.forEach((fn) => {
    try {
      fn(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
    } catch {
      /* a listener throwing must not break sign-out */
    }
  })
}

function errorFrom(status, body, fallback) {
  const message =
    body?.msg ||
    body?.message ||
    body?.error_description ||
    body?.error ||
    fallback ||
    `Request failed (${status})`
  return { message: String(message), status }
}

async function rawRequest(path, options, token) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${token || anonKey}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }
  const response = await fetch(`${url}${path}`, { ...options, headers })
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  return { response, body }
}

async function refreshSession() {
  if (!currentSession?.refresh_token) return null
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const { response, body } = await rawRequest(
        '/auth/v1/token?grant_type=refresh_token',
        { method: 'POST', body: JSON.stringify({ refresh_token: currentSession.refresh_token }) },
        anonKey,
      )
      if (!response.ok) {
        persist(null)
        return null
      }
      persist(body)
      return body
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function sessionIsFresh(session) {
  if (!session?.access_token) return false
  if (!session.expires_at) return true
  return session.expires_at - Date.now() / 1000 > REFRESH_MARGIN_SECONDS
}

/** Valid access token, refreshing transparently when it is close to expiry. */
async function accessToken() {
  if (!currentSession) return anonKey
  if (sessionIsFresh(currentSession)) return currentSession.access_token
  const refreshed = await refreshSession()
  return refreshed?.access_token || currentSession?.access_token || anonKey
}

async function request(path, options = {}, { auth = true, retry = true } = {}) {
  const token = auth ? await accessToken() : anonKey
  const { response, body } = await rawRequest(path, options, token)

  if (response.status === 401 && retry && currentSession) {
    const refreshed = await refreshSession()
    if (refreshed) {
      const retried = await rawRequest(path, options, refreshed.access_token)
      if (retried.response.ok) return { data: retried.body, error: null }
      return { data: null, error: errorFrom(retried.response.status, retried.body) }
    }
    persist(null)
  }

  if (!response.ok) return { data: null, error: errorFrom(response.status, body) }
  return { data: body, error: null }
}

class Query {
  constructor(table) {
    this.table = table
    this.method = 'GET'
    this.params = new URLSearchParams()
    this.payload = null
    this.returning = false
    this.singleMode = false
    this.oneShot = false
  }

  select(columns = '*') {
    this.params.set('select', columns)
    if (this.method !== 'GET') this.returning = true
    return this
  }

  eq(key, value) {
    this.params.set(key, `eq.${value}`)
    return this
  }

  neq(key, value) {
    this.params.set(key, `neq.${value}`)
    return this
  }

  in(key, values) {
    this.params.set(key, `in.(${values.join(',')})`)
    return this
  }

  lte(key, value) {
    this.params.set(key, `lte.${value}`)
    return this
  }

  gte(key, value) {
    this.params.set(key, `gte.${value}`)
    return this
  }

  order(key, { ascending = true } = {}) {
    this.params.set('order', `${key}.${ascending ? 'asc' : 'desc'}`)
    return this
  }

  limit(value) {
    this.params.set('limit', String(value))
    return this
  }

  range(from, to) {
    this.params.set('offset', String(from))
    this.params.set('limit', String(to - from + 1))
    return this
  }

  insert(payload) {
    this.method = 'POST'
    this.payload = payload
    return this
  }

  update(payload) {
    this.method = 'PATCH'
    this.payload = payload
    return this
  }

  upsert(payload) {
    this.method = 'POST'
    this.payload = payload
    this.params.set('on_conflict', 'key')
    return this
  }

  delete() {
    this.method = 'DELETE'
    return this
  }

  single() {
    this.singleMode = true
    return this
  }

  maybeSingle() {
    this.singleMode = true
    this.oneShot = true
    return this
  }

  then(resolve, reject) {
    if (this.sent) {
      const error = { message: 'This query has already been executed.', status: 0 }
      return Promise.resolve({ data: null, error }).then(resolve, reject)
    }
    this.sent = true

    const prefer = []
    if (this.returning) prefer.push('return=representation')
    if (this.method === 'POST') prefer.push('return=representation', 'resolution=merge-duplicates')

    const path = `/rest/v1/${encodeURIComponent(this.table)}?${this.params.toString()}`

    return request(path, {
      method: this.method,
      body: this.payload ? JSON.stringify(this.payload) : undefined,
      headers: prefer.length ? { Prefer: prefer.join(',') } : {},
    }).then((result) => {
      if (!result.error && this.singleMode) {
        const data = Array.isArray(result.data) ? result.data[0] || null : result.data
        if (!data && !this.oneShot) {
          return { data: null, error: { message: `No row found in ${this.table}.`, status: 406 } }
        }
        return { data, error: null }
      }
      return result
    }).then(resolve, reject)
  }
}

async function storageRequest(path, options = {}) {
  const token = await accessToken()
  const response = await fetch(`${url}/storage/v1${path}`, {
    ...options,
    headers: { apikey: anonKey, Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    return { data: null, error: errorFrom(response.status, body, `Storage request failed (${response.status})`) }
  }
  return { data: body, error: null }
}

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/')

const auth = {
  async getSession() {
    if (currentSession && !sessionIsFresh(currentSession)) {
      const refreshed = await refreshSession()
      if (refreshed) return { data: { session: refreshed }, error: null }
    }
    return { data: { session: currentSession }, error: null }
  },

  onAuthStateChange(callback) {
    listeners.add(callback)
    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(callback)
          },
        },
      },
    }
  },

  async signInWithPassword({ email, password }) {
    const result = await request(
      '/auth/v1/token?grant_type=password',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      { auth: false, retry: false },
    )
    if (!result.error) persist(result.data)
    return result
  },

  async signOut() {
    // Best effort: revoke server-side, but clear locally even if the call fails.
    await request('/auth/v1/logout', { method: 'POST' }).catch(() => null)
    persist(null)
    return { error: null }
  },

  /** Sends a recovery email. The link returns to the app with a recovery token. */
  async resetPasswordForEmail(email, redirectTo) {
    return request(
      '/auth/v1/recover',
      { method: 'POST', body: JSON.stringify({ email, redirect_to: redirectTo }) },
      { auth: false, retry: false },
    )
  },

  /** Exchange the recovery token from the email link for a session. */
  async verifyRecoveryToken({ token_hash, type = 'recovery' }) {
    const result = await request(
      '/auth/v1/verify',
      { method: 'POST', body: JSON.stringify({ token_hash, type }) },
      { auth: false, retry: false },
    )
    if (!result.error && result.data?.access_token) persist(result.data)
    return result
  },

  /** Change the password of the signed-in user. */
  async updateUser({ password }) {
    return request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) })
  },

  async getUser() {
    const result = await request('/auth/v1/user')
    return result
  },
}

export const supabase = isConfigured
  ? {
      from(table) {
        return new Query(table)
      },
      auth,
      storage: {
        async upload(bucket, path, file) {
          const token = await accessToken()
          const encoded = encodePath(path)
          const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encoded}`, {
            method: 'POST',
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${token}`,
              'Content-Type': file.type,
              'x-upsert': 'true',
            },
            body: file,
          })
          const body = await response.json().catch(() => null)
          if (!response.ok) {
            return { data: null, error: errorFrom(response.status, body, `Upload failed (${response.status})`) }
          }
          return {
            data: {
              ...body,
              path,
              bucket,
              publicUrl: `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encoded}`,
            },
            error: null,
          }
        },
        async list(bucket) {
          const result = await storageRequest(`/object/list/${encodeURIComponent(bucket)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix: '', limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } }),
          })
          if (result.error) return result
          return {
            data: (result.data || []).map((item) => ({
              ...item,
              publicUrl: `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodePath(item.name)}`,
            })),
            error: null,
          }
        },
        async remove(bucket, path) {
          return storageRequest(`/object/${encodeURIComponent(bucket)}/${encodePath(path)}`, { method: 'DELETE' })
        },
      },
    }
  : null

/** True when the JWT carries the admin claim the RLS policies check. */
export function sessionIsAdmin(session) {
  const meta = session?.user?.app_metadata
  return Boolean(meta && meta.role === 'admin')
}
