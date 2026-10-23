/** GitHub Contents API gateway. Keep GITHUB_TOKEN and ADMIN_PASSWORD as Worker secrets. */
const reply = (data, status = 200, origin = '*') => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', Vary: 'Origin' } });
export default { async fetch(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN || origin || '*';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } });
  if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) return reply({ error: 'Origin not allowed' }, 403, env.ALLOWED_ORIGIN);
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO || !env.CONTENT_PATH) return reply({ error: 'Worker is not configured; see GITHUB_CONTENT_SETUP.md' }, 503, allowed);
  if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/auth')) {
    let body; try { body = await request.json(); } catch { return reply({ error: 'Invalid JSON' }, 400, allowed); }
    const supplied = String(body?.password || ''); const expected = String(env.ADMIN_PASSWORD || '');
    if (!expected || supplied.length !== expected.length) return reply({ error: 'Invalid administrator password' }, 401, allowed);
    let authDiff = 0; for (let i = 0; i < supplied.length; i++) authDiff |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
    if (authDiff !== 0) return reply({ error: 'Invalid administrator password' }, 401, allowed);
    return reply({ ok: true }, 200, allowed);
  }
  const branch = env.GITHUB_BRANCH || 'main';
  const api = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${env.CONTENT_PATH}`;
  const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'portfolio-content-gateway' };
  if (request.method === 'GET') {
    const r = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers }); const data = await r.json().catch(() => ({}));
    if (!r.ok) return reply({ error: r.status === 404 ? 'Content file not initialized' : 'Could not read GitHub content', detail: data.message }, r.status, allowed);
    try { const binary = atob((data.content || '').replace(/\n/g, '')); const bytes = Uint8Array.from(binary, c => c.charCodeAt(0)); return new Response(bytes, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Access-Control-Allow-Origin': allowed, Vary: 'Origin', ETag: data.sha || '' } }); }
    catch { return reply({ error: 'Invalid base64 content in GitHub file' }, 502, allowed); }
  }
  if (request.method !== 'PUT') return reply({ error: 'Method not allowed' }, 405, allowed);
  const auth = request.headers.get('Authorization') || ''; const supplied = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!env.ADMIN_PASSWORD || supplied.length !== env.ADMIN_PASSWORD.length) return reply({ error: 'Unauthorized' }, 401, allowed);
  let diff = 0; for (let i = 0; i < supplied.length; i++) diff |= supplied.charCodeAt(i) ^ env.ADMIN_PASSWORD.charCodeAt(i);
  if (diff !== 0) return reply({ error: 'Unauthorized' }, 401, allowed);
  let payload; try { payload = await request.json(); } catch { return reply({ error: 'Invalid JSON' }, 400, allowed); }
  const serialized = JSON.stringify(payload, null, 2); if (serialized.length > 900000) return reply({ error: 'Content too large; avoid base64 images in JSON' }, 413, allowed);
  const current = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers }); let sha;
  if (current.ok) sha = (await current.json()).sha; else if (current.status !== 404) { const d = await current.json().catch(() => ({})); return reply({ error: 'Could not read current file', detail: d.message }, current.status, allowed); }
  const bytes = new TextEncoder().encode(serialized); let binary = ''; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const r = await fetch(api, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Update portfolio content ${new Date().toISOString()}`, content: btoa(binary), branch, ...(sha ? { sha } : {}) }) }); const result = await r.json().catch(() => ({}));
  if (!r.ok) return reply({ error: 'GitHub rejected update', detail: result.message }, r.status, allowed);
  return reply({ ok: true, commit: result.commit?.sha, updated_at: result.commit?.committer?.date || new Date().toISOString() }, 200, allowed);
} };
