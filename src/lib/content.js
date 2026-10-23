// Use the shared Supabase database when deployment environment variables are configured.
import { supabase as remoteSupabase, isConfigured } from './supabase'
import { gatewayRequest, githubGatewayConfigured, uploadGitHubMedia } from './githubGateway'
const useGithubGateway = githubGatewayConfigured()
const supabase = !useGithubGateway && isConfigured ? remoteSupabase : null
import { fallbackContent, seedSite, seedProfile, DEFAULT_COPY, DEFAULT_STATS } from './seed'
import { DEFAULT_THEME, validateTheme } from './theme'
import { isPostPublic, sortPosts } from './format'

// Data access for the portfolio. Every public read is subject to RLS: the anon
// role only ever sees published rows and a whitelist of site_settings keys, so
// drafts and contact submissions cannot be fetched from the browser even if a
// request is crafted by hand.
//
// When Supabase is not configured the site renders the bundled seed content, so
// it remains a working static site rather than a broken one.

export const contentSource = useGithubGateway ? 'github' : isConfigured ? 'supabase' : 'local'

// Browser-local CMS: no hosted database or third-party backend required.
const LOCAL_CONTENT_KEY = 'mahesh-portfolio-local-cms-v1'
const PROJECT_CATALOG_MIGRATION_KEY = 'mahesh-portfolio-project-catalog-v2'
const STAGED_CONTENT_KEY = 'mahesh-portfolio-staged-content-v1'
const LEGACY_CLIENT_CATEGORIES = {
  'rev-a-shelf': 'Adobe Commerce Cloud',
  'who has it?': 'Adobe Commerce Cloud',
  'midas furniture': 'Adobe Commerce Cloud',
  'american lighting': 'Adobe Commerce Cloud',
  melissa: 'Adobe Commerce Cloud',
  'rak ceramics': 'Adobe Commerce Cloud',
  okapius: 'Adobe Commerce Cloud',
  'tent and table': 'Adobe Commerce Enterprise',
  'tdot performance': 'Adobe Commerce Enterprise',
  'rp tech india': 'Adobe Commerce Enterprise',
  'tools plus': 'Adobe Commerce Enterprise',
  noctua: 'Magento Open Source',
  bokacha: 'Magento Open Source',
  'pool spot': 'Magento Open Source',
  'deadwood knives': 'Magento Open Source',
}
function categoryForLegacyProject(project) {
  const title = String(project.title || '').toLowerCase()
  if (title.includes('odoo') || title.includes('salesforce') || title.includes('jitterbit')) return 'Integrations & APIs'
  if (title.includes('ai-') || title.includes('sensei') || title.includes('conversational commerce') || title.includes('mcp')) return 'AI & Innovation'
  if (title.includes('community') || title.includes('stack exchange')) return 'Community & Knowledge'
  if (title.includes('resume')) return 'Professional Resources'
  if (title.includes('optimizer')) return 'Adobe Commerce Platform'
  if (title.includes('hyvä') || title.includes('headless') || title.includes('configurator')) return 'Headless & Storefronts'
  if (LEGACY_CLIENT_CATEGORIES[title]) return LEGACY_CLIENT_CATEGORIES[title]
  return project.category || 'Adobe Commerce Platform'
}
function migrateLegacyProjectCategories(projects) {
  if (!Array.isArray(projects)) return []
  const migrated = []
  for (const project of projects) {
    const title = String(project.title || '').trim()
    const links = Array.isArray(project.clientLinks) ? project.clientLinks : []
    // The old build bundled all client sites into one card. Expand it to one
    // card per client so no client disappears behind the old grouped entry.
    if (links.length && /enterprise commerce implementations/i.test(title)) {
      for (const [index, client] of links.entries()) {
        const clientTitle = String(client.name || '').trim()
        if (!clientTitle) continue
        const category = LEGACY_CLIENT_CATEGORIES[clientTitle.toLowerCase()] || 'Adobe Commerce Cloud'
        migrated.push({
          id: `legacy-client-${clientTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          title: clientTitle,
          category,
          description: `${category} implementation listed in the 2026 resume.`,
          techStack: [category, 'Magento 2'],
          url: client.url || '',
          linkLabel: client.url ? 'Visit project' : 'Project reference',
          clientLinks: [],
          is_published: project.is_published !== false,
          sort_order: Number(project.sort_order || 0) + index,
        })
      }
      continue
    }
    migrated.push({
      ...project,
      category: categoryForLegacyProject(project),
      clientLinks: links,
    })
  }
  return migrated
}
function mergeNewSeedProjects(projects) {
  const next = [...projects]
  const keys = new Set(next.map((project) => String(project.title || '').trim().toLowerCase()))
  for (const seed of fallbackContent.projects) {
    const key = String(seed.title || '').trim().toLowerCase()
    if (!keys.has(key)) {
      next.push({ ...seed })
      keys.add(key)
    }
  }
  return next
}
function readLocalContent() {
  try {
    const raw = localStorage.getItem(LOCAL_CONTENT_KEY)
    const saved = JSON.parse(raw || 'null')
    if (saved && typeof saved === 'object') {
      let projects = migrateLegacyProjectCategories(saved.projects || fallbackContent.projects)
      // One-time additive migration: preserve admin-created content and edits,
      // while restoring every missing resume-derived project from the new catalog.
      if (localStorage.getItem(PROJECT_CATALOG_MIGRATION_KEY) !== 'done') {
        projects = mergeNewSeedProjects(projects)
        try {
          localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify({ ...saved, projects }))
          localStorage.setItem(PROJECT_CATALOG_MIGRATION_KEY, 'done')
        } catch { /* keep the in-memory migration; retry next visit if storage is full */ }
      }
      return { ...fallbackContent, ...saved, projects, site: { ...fallbackContent.site, ...(saved.site || {}) }, theme: saved.theme || DEFAULT_THEME, themeDraft: saved.themeDraft || saved.theme || DEFAULT_THEME, themePublished: saved.themePublished || saved.theme || DEFAULT_THEME }
    }
  } catch { /* use bundled defaults when storage is unavailable or invalid */ }
  return { ...fallbackContent, theme: DEFAULT_THEME, themeDraft: DEFAULT_THEME, themePublished: DEFAULT_THEME, settingsRows: [] }
}
export function getInitialAdminContent() {
  return readLocalContent()
}

let sharedWritePromise = Promise.resolve()
function writeLocalContent(next) {
  try {
    localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(next))
    // The admin edits a local staging copy. GitHub is only updated by the
    // explicit Publish action in the admin header.
    localStorage.setItem(STAGED_CONTENT_KEY, JSON.stringify(next))
  } catch { throw new Error('Browser storage is full. Use smaller images or export your content backup before continuing.') }
  window.dispatchEvent(new CustomEvent('portfolio-local-content-updated'))
  window.dispatchEvent(new CustomEvent('portfolio-staging-updated'))
  return next
}
export function hasStagedContent() {
  try { return Boolean(localStorage.getItem(STAGED_CONTENT_KEY)) } catch { return false }
}
export async function publishStagedContent() {
  let staged
  try { staged = JSON.parse(localStorage.getItem(STAGED_CONTENT_KEY) || 'null') } catch { staged = null }
  if (!staged) throw new Error('There are no staged changes to publish.')
  if (useGithubGateway) {
    await gatewayRequest('', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staged) })
  }
  try { localStorage.removeItem(STAGED_CONTENT_KEY) } catch {}
  window.dispatchEvent(new CustomEvent('portfolio-staging-updated'))
  return true
}
async function flushSharedContent() { /* writes are staged; publish is explicit */ }
function updateLocalContent(updater) { return writeLocalContent(updater(readLocalContent())) }
async function readSharedContent() {
  try { return await gatewayRequest('', { method: 'GET', cache: 'no-store' }) }
  catch (error) {
    if (/not initialized|404|content file/i.test(error.message)) return readLocalContent()
    throw error
  }
}
export function exportLocalContent() { return JSON.stringify(readLocalContent(), null, 2) }
export function importLocalContent(json) {
  let parsed
  try { parsed = JSON.parse(json) } catch { throw new Error('This backup is not valid JSON.') }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.projects) || !parsed.profile) throw new Error('This file does not look like a portfolio backup.')
  writeLocalContent({ ...fallbackContent, ...parsed, theme: parsed.theme || DEFAULT_THEME })
  return readLocalContent()
}

/* ------------------------------------------------------------- normalizers */

const asArray = (value) => (Array.isArray(value) ? value : [])

function normalizeProject(row) {
  return {
    id: row.id,
    title: row.title || 'Untitled project',
    category: row.category || 'Featured project',
    description: row.description || '',
    techStack: asArray(row.technologies || row.techStack),
    url: row.demo_url || row.url || '',
    linkLabel: row.link_label || row.linkLabel || 'View project',
    image: row.image_url || row.image || '',
    clientLogo: row.client_logo_url || row.clientLogo || '',
    clientLinks: asArray(row.client_links || row.clientLinks),
    is_published: row.is_published !== false,
    sort_order: row.sort_order ?? 0,
  }
}

function normalizeCertification(row) {
  return {
    id: row.id,
    name: row.name || 'Credential',
    issuer: row.issuer || '',
    year: row.year || (row.issued_at ? String(row.issued_at).slice(0, 4) : ''),
    verificationUrl: row.verification_url || row.verificationUrl || '',
    image: row.image_url || row.image || '',
    is_published: row.is_published !== false,
    sort_order: row.sort_order ?? 0,
  }
}

function normalizeExperience(row) {
  return {
    id: row.id,
    role: row.role || '',
    company: row.company || '',
    duration: row.duration || '',
    description: row.description || '',
    is_published: row.is_published !== false,
    sort_order: row.sort_order ?? 0,
  }
}

function normalizeEducation(row) {
  return {
    id: row.id,
    degree: row.degree || '',
    school: row.institution || row.school || '',
    year: row.graduation_year || row.year || '',
    detail: row.details || row.detail || '',
    is_published: row.is_published !== false,
    sort_order: row.sort_order ?? 0,
  }
}

export function normalizePost(row) {
  return {
    id: row.id,
    title: row.title || 'Untitled article',
    slug: row.slug || '',
    category: row.category || 'Engineering notes',
    excerpt: row.excerpt || '',
    content: row.content || '',
    cover_image_url: row.cover_image_url || '',
    status: row.status === 'published' ? 'published' : 'draft',
    published_at: row.published_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    author: row.author || 'Mahesh Dave',
    tags: asArray(row.tags),
    seo_title: row.seo_title || '',
    seo_description: row.seo_description || '',
    canonical_url: row.canonical_url || '',
  }
}

function normalizeProfile(row) {
  if (!row) return seedProfile
  const about = row.about && typeof row.about === 'object' ? row.about : null
  return {
    ...seedProfile,
    id: row.id,
    name: row.name || seedProfile.name,
    shortName: row.short_name || row.name || seedProfile.shortName,
    title: row.title || seedProfile.title,
    intro: row.intro || seedProfile.intro,
    location: row.location || seedProfile.location,
    email: row.email || seedProfile.email,
    profileImage: row.image_url || seedProfile.profileImage,
    resumeUrl: row.resume_url || seedProfile.resumeUrl,
    availability: row.availability || seedProfile.availability,
    social_urls: { ...seedProfile.social_urls, ...(row.social_urls || {}) },
    about: {
      ...seedProfile.about,
      ...(about || {}),
    },
  }
}

/** Merge a `site_settings` key/value response onto the seed settings. */
export function mergeSiteSettings(rows = []) {
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  const copy = { ...DEFAULT_COPY, ...(map.copy && typeof map.copy === 'object' ? map.copy : {}) }
  const stats = Array.isArray(map.stats) ? map.stats : DEFAULT_STATS
  const techStackValue = Array.isArray(map.tech_stack) ? map.tech_stack : seedSite.techStack

  return {
    siteTitle: map.site_title?.title || seedSite.siteTitle,
    siteDescription: map.site_title?.description || seedSite.siteDescription,
    siteLogo: map.branding?.logo || '',
    contactEmail: map.branding?.contact_email || seedSite.contactEmail,
    showClientProjects: map.branding?.show_client_projects !== false,
    copy,
    stats,
    techStack: techStackValue,
    structure: map.site_structure?.structure || {},
    navigationLinks: map.site_structure?.navigationLinks || undefined,
    customSections: map.site_structure?.customSections || [],
    menuStyle: map.site_structure?.menuStyle || 'underline',
  }
}

export function themeFromSettings(rows = []) {
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  const { theme } = validateTheme(map.theme_published || DEFAULT_THEME)
  return theme
}


/** Local preview is intentionally opt-in and never writes to GitHub. The preview
 * flag is copied into sessionStorage so client-side route changes keep preview
 * mode active after the query string disappears. */
export function isLocalPreviewMode() {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('preview') === 'local') {
      window.sessionStorage.setItem('portfolio-local-preview', '1')
      return true
    }
    return window.sessionStorage.getItem('portfolio-local-preview') === '1'
  } catch { return new URLSearchParams(window.location.search).get('preview') === 'local' }
}
function getLocalPreviewContent() {
  const local = readLocalContent()
  return {
    ...local,
    projects: asArray(local.projects),
    certifications: asArray(local.certifications),
    experience: asArray(local.experience),
    education: asArray(local.education),
    // Preview deliberately includes drafts so editors can inspect them before publishing.
    posts: sortPosts(asArray(local.posts)),
    theme: local.themeDraft || local.theme || DEFAULT_THEME,
  }
}

/* -------------------------------------------------------------- public read */

export async function fetchPublicContent() {
  if (isLocalPreviewMode()) return getLocalPreviewContent()
  if (useGithubGateway) { const shared = await readSharedContent(); return { ...shared, ...fallbackContent, ...shared, projects: asArray(shared.projects || fallbackContent.projects).filter((x) => x.is_published !== false), certifications: asArray(shared.certifications || fallbackContent.certifications).filter((x) => x.is_published !== false), experience: asArray(shared.experience || fallbackContent.experience).filter((x) => x.is_published !== false), education: asArray(shared.education || fallbackContent.education).filter((x) => x.is_published !== false), posts: sortPosts(asArray(shared.posts).filter(isPostPublic)), theme: shared.themePublished || shared.theme || DEFAULT_THEME } }
  if (!supabase) { const local = readLocalContent(); return { ...local, projects: asArray(local.projects).filter((x) => x.is_published !== false), certifications: asArray(local.certifications).filter((x) => x.is_published !== false), experience: asArray(local.experience).filter((x) => x.is_published !== false), education: asArray(local.education).filter((x) => x.is_published !== false), posts: sortPosts(asArray(local.posts).filter(isPostPublic)), theme: local.themePublished || local.theme || DEFAULT_THEME } }

  const nowIso = new Date().toISOString()
  const [profileResult, projects, certifications, experience, education, posts, settings] = await Promise.allSettled([
    supabase.from('profile').select('*').limit(1).maybeSingle(),
    supabase.from('projects').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('certifications').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('experience').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('education').select('*').eq('is_published', true).order('sort_order'),
    supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .lte('published_at', nowIso)
      .order('published_at', { ascending: false }),
    supabase
      .from('site_settings')
      .select('key,value')
      .in('key', ['site_title', 'branding', 'copy', 'stats', 'tech_stack', 'theme_published', 'site_structure']),
  ])

  const settled = (result, fallback) => (result.status === 'fulfilled' && !result.value.error ? result.value.data : fallback)

  const settingRows = asArray(settled(settings, []))

  return {
    profile: normalizeProfile(settled(profileResult, null)),
    projects: asArray(settled(projects, [])).map(normalizeProject),
    certifications: asArray(settled(certifications, [])).map(normalizeCertification),
    experience: asArray(settled(experience, [])).map(normalizeExperience),
    education: asArray(settled(education, [])).map(normalizeEducation),
    posts: sortPosts(asArray(settled(posts, [])).map(normalizePost)),
    site: mergeSiteSettings(settingRows),
    theme: themeFromSettings(settingRows),
  }
}

/**
 * Public single-article read. Drafts are excluded by RLS regardless of slug, but
 * the timestamp check is repeated here so a future-dated post is not exposed by
 * a client that skipped the list query.
 */
export async function fetchPostBySlug(slug) {
  if (isLocalPreviewMode()) return asArray(readLocalContent().posts).map(normalizePost).find((post) => post.slug === slug) || null
  if (useGithubGateway) return asArray((await readSharedContent()).posts).map(normalizePost).find((post) => post.slug === slug && isPostPublic(post)) || null
  if (!supabase) return asArray(readLocalContent().posts).map(normalizePost).find((post) => post.slug === slug && isPostPublic(post)) || null
  if (supabase) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .limit(1)
      .maybeSingle()
    if (!error && data) {
      const post = normalizePost(data)
      return isPostPublic(post) ? post : null
    }
  }
  return null
}

/* --------------------------------------------------------------- admin read */

const ADMIN_TABLES = ['profile', 'projects', 'certifications', 'experience', 'education', 'blog_posts', 'site_settings']

export async function fetchAdminContent() {
  if (useGithubGateway) {
    const shared = await readSharedContent()
    const local = readLocalContent()
    // Admin edits are staged in localStorage until Publish. Merge collection
    // rows by stable ID so a reload never discards a newly-created or edited
    // article just because the published GitHub JSON still has the old version.
    const mergeRows = (key) => {
      const publishedRows = asArray(shared[key])
      const stagedRows = asArray(local[key])
      const byId = new Map(publishedRows.map((row, index) => [String(row.id ?? `${key}-published-${index}`), row]))
      stagedRows.forEach((row, index) => {
        const id = String(row.id ?? `${key}-local-${index}`)
        byId.set(id, { ...(byId.get(id) || {}), ...row })
      })
      return [...byId.values()]
    }
    const merged = {
      ...local,
      ...shared,
      projects: mergeRows('projects'),
      certifications: mergeRows('certifications'),
      experience: mergeRows('experience'),
      education: mergeRows('education'),
      posts: mergeRows('posts'),
      profile: { ...(shared.profile || {}), ...(local.profile || {}) },
      site: { ...(shared.site || {}), ...(local.site || {}) },
    }
    try { localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(merged)) } catch { /* keep the in-memory merged state */ }
    return merged
  }
  if (!supabase) return readLocalContent()

  const [profileResult, projects, certifications, experience, education, posts, settings] = await Promise.allSettled([
    supabase.from('profile').select('*').limit(1).maybeSingle(),
    supabase.from('projects').select('*').order('sort_order'),
    supabase.from('certifications').select('*').order('sort_order'),
    supabase.from('experience').select('*').order('sort_order'),
    supabase.from('education').select('*').order('sort_order'),
    supabase.from('blog_posts').select('*').order('updated_at', { ascending: false }),
    supabase.from('site_settings').select('key,value'),
  ])

  const failed = [profileResult, projects, certifications, experience, education, posts, settings]
    .filter((r) => r.status === 'rejected' || r.value?.error)
    .map((r) => (r.status === 'rejected' ? r.reason?.message : r.value.error?.message))
    .filter(Boolean)

  if (failed.length) {
    const error = new Error(failed[0])
    // A permission error is different from an outage; surface it to the caller.
    error.permission = failed.some((message) => /permission|policy|jwt|row-level/i.test(message))
    throw error
  }

  const value = (result) => result.value.data
  const settingRows = asArray(value(settings))
  const map = Object.fromEntries(settingRows.map((row) => [row.key, row.value]))

  return {
    profile: normalizeProfile(value(profileResult)),
    profileRow: value(profileResult),
    projects: asArray(value(projects)).map(normalizeProject),
    certifications: asArray(value(certifications)).map(normalizeCertification),
    experience: asArray(value(experience)).map(normalizeExperience),
    education: asArray(value(education)).map(normalizeEducation),
    posts: asArray(value(posts)).map(normalizePost),
    site: mergeSiteSettings(settingRows),
    settingsRows: settingRows,
    themePublished: themeFromSettings(settingRows),
    themeDraft: validateTheme(map.theme_draft || map.theme_published || DEFAULT_THEME).theme,
  }
}

/* ------------------------------------------------------------------ writes */

const tableFor = {
  projects: 'projects',
  certifications: 'certifications',
  experience: 'experience',
  education: 'education',
  posts: 'blog_posts',
}

/** Map our UI record shape onto database columns. */
export function toDbRow(collection, record) {
  if (collection === 'projects') {
    return {
      title: record.title,
      description: record.description || '',
      technologies: asArray(record.techStack),
      image_url: record.image || null,
      client_logo_url: record.clientLogo || null,
      demo_url: record.url || null,
      link_label: record.linkLabel || null,
      category: record.category || null,
      client_links: asArray(record.clientLinks),
      is_published: record.is_published !== false,
      sort_order: Number(record.sort_order) || 0,
    }
  }
  if (collection === 'certifications') {
    return {
      name: record.name,
      issuer: record.issuer || '',
      year: record.year || '',
      verification_url: record.verificationUrl || null,
      image_url: record.image || null,
      is_published: record.is_published !== false,
      sort_order: Number(record.sort_order) || 0,
    }
  }
  if (collection === 'experience') {
    return {
      role: record.role,
      company: record.company,
      duration: record.duration || '',
      description: record.description || '',
      is_published: record.is_published !== false,
      sort_order: Number(record.sort_order) || 0,
    }
  }
  if (collection === 'education') {
    return {
      degree: record.degree,
      institution: record.school || '',
      graduation_year: record.year || '',
      details: record.detail || '',
      is_published: record.is_published !== false,
      sort_order: Number(record.sort_order) || 0,
    }
  }
  return {
    title: record.title,
    slug: record.slug,
    excerpt: record.excerpt || '',
    content: record.content || '',
    category: record.category || null,
    cover_image_url: record.cover_image_url || null,
    status: record.status === 'published' ? 'published' : 'draft',
    published_at: record.published_at || null,
    author: record.author || 'Mahesh Dave',
    tags: asArray(record.tags).map((tag) => String(tag).trim()).filter(Boolean),
    seo_title: record.seo_title || null,
    seo_description: record.seo_description || null,
    canonical_url: record.canonical_url || null,
  }
}

export async function saveRecord(collection, record) {
  if (!supabase) {
    if (!['projects', 'certifications', 'experience', 'education', 'posts'].includes(collection)) throw new Error(`Unknown collection: ${collection}`)
    const current = readLocalContent(); const rows = asArray(current[collection]); const saved = { ...record, id: record.id && !String(record.id).startsWith('seed-') ? record.id : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, updated_at: new Date().toISOString() }
    if (collection === 'posts' && (!saved.title || !saved.slug)) throw new Error('An article needs a title and slug.')
    updateLocalContent((state) => { const existingId = record.id && !String(record.id).startsWith('seed-'); const index = existingId ? rows.findIndex((row) => String(row.id) === String(record.id)) : -1; const nextRows = [...rows]; if (index >= 0) nextRows[index] = { ...rows[index], ...saved }; else nextRows.push(saved); return { ...state, [collection]: nextRows } })
    await flushSharedContent()
    return saved
  }
  const table = tableFor[collection]
  if (!table) throw new Error(`Unknown collection: ${collection}`)
  const row = toDbRow(collection, record)

  if (table === 'blog_posts') {
    if (!row.slug) throw new Error('An article needs a slug.')
    if (!row.title) throw new Error('An article needs a title.')
  }

  if (record.id && String(record.id).startsWith('seed-')) {
    delete row.id
    const { data, error } = await supabase.from(table).insert(row).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  if (record.id) {
    const { data, error } = await supabase.from(table).update(row).eq('id', record.id).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteRecord(collection, id) {
  if (!supabase) { updateLocalContent((state) => ({ ...state, [collection]: asArray(state[collection]).filter((row) => row.id !== id) })); await flushSharedContent(); return }

  if (!id || String(id).startsWith('seed-')) {
    throw new Error('Bundled sample content cannot be deleted from the database; hide it instead.')
  }
  const { error } = await supabase.from(tableFor[collection]).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveProfile(profile) {
  if (!supabase) { updateLocalContent((state) => ({ ...state, profile: { ...state.profile, ...profile } })); await flushSharedContent(); return }
  const row = {
    name: profile.name,
    title: profile.title || '',
    intro: profile.intro || '',
    about: { bio: profile.about?.bio || '', focus: profile.about?.focus || '', summary: profile.about?.summary || '' },
    email: profile.email || '',
    location: profile.location || '',
    availability: profile.availability || '',
    social_urls: profile.social_urls || {},
    resume_url: profile.resumeUrl || '',
    image_url: profile.profileImage || '',
    updated_at: new Date().toISOString(),
  }

  if (profile.id) {
    const { error } = await supabase.from('profile').update(row).eq('id', profile.id)
    if (error) throw new Error(error.message)
    return
  }
  const { error } = await supabase.from('profile').insert(row)
  if (error) throw new Error(error.message)
}

/** Upsert one key of `site_settings`. Used for copy, stats, branding and theme. */
export async function saveSetting(key, value) {
  if (!supabase) { updateLocalContent((state) => { const next = { ...state }; if (key === 'theme_draft') next.themeDraft = value; else if (key === 'theme_published') { next.themePublished = value; next.theme = value } else if (key === 'copy') next.site = { ...next.site, copy: value }; else if (key === 'stats') next.site = { ...next.site, stats: value }; else if (key === 'tech_stack') next.site = { ...next.site, techStack: value }; else if (key === 'site_structure') next.site = { ...next.site, ...value }; else if (key === 'site_title') next.site = { ...next.site, siteTitle: value.title || next.site.siteTitle, siteDescription: value.description || next.site.siteDescription }; else if (key === 'branding') next.site = { ...next.site, siteLogo: value.logo || '', contactEmail: value.contact_email || next.site.contactEmail, showClientProjects: value.show_client_projects !== false }; next.settingsRows = [...asArray(next.settingsRows).filter((row) => row.key !== key), { key, value }]; return next }); await flushSharedContent(); return }
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

export async function saveSiteSettings(site) {
  if (!supabase) { updateLocalContent((state) => ({ ...state, site: { ...state.site, ...site } })); await flushSharedContent(); return }
  await saveSetting('site_title', { title: site.siteTitle, description: site.siteDescription })
  await saveSetting('branding', {
    logo: site.siteLogo || '',
    contact_email: site.contactEmail || '',
    show_client_projects: site.showClientProjects !== false,
  })
  await saveSetting('copy', site.copy)
  await saveSetting('stats', site.stats)
  await saveSetting('tech_stack', site.techStack)
}

export async function uploadImage(file, folder = 'uploads') {
  if (!file || !String(file.type || '').startsWith('image/')) throw new Error('Choose a valid image file.')
  if (useGithubGateway) return uploadGitHubMedia(file, folder)
  if (!supabase) {
    // Store a compressed portrait in browser storage rather than the original
    // camera image. This prevents a multi-megabyte data URL from slowing every
    // admin visit and avoids exhausting the browser's localStorage quota.
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Could not read this image.'))
      reader.readAsDataURL(file)
    })
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const maxWidth = 1000
        const maxHeight = 1400
        const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)
        const width = Math.max(1, Math.round(image.naturalWidth * scale))
        const height = Math.max(1, Math.round(image.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) { resolve(dataUrl); return }
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        try { resolve(canvas.toDataURL('image/jpeg', 0.8)) }
        catch { resolve(dataUrl) }
      }
      image.onerror = () => reject(new Error('This image could not be opened. Please choose a JPG, PNG, or WebP image.'))
      image.src = dataUrl
    })
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { data, error } = await supabase.storage.upload('portfolio-media', path, file)
  if (error) throw new Error(error.message)
  return data.publicUrl
}

/* ------------------------------------------------------------- contact form */

const CONTACT_LIMIT_KEY = 'portfolio-contact-last-sent'
const CONTACT_COOLDOWN_MS = 30_000

export async function submitContactMessage({ name, email, message, website }) {
  // Honeypot: a real browser never fills this hidden field.
  if (website) return { ok: true }

  const trimmed = {
    name: String(name || '').trim().slice(0, 120),
    email: String(email || '').trim().slice(0, 200),
    message: String(message || '').trim().slice(0, 4000),
  }

  if (!trimmed.name || !trimmed.email || !trimmed.message) {
    throw new Error('Please fill in your name, email and message.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed.email)) {
    throw new Error('Please enter a valid email address.')
  }
  if (trimmed.message.length < 10) {
    throw new Error('Please write a slightly longer message.')
  }

  try {
    const last = Number(localStorage.getItem(CONTACT_LIMIT_KEY) || 0)
    if (Date.now() - last < CONTACT_COOLDOWN_MS) {
      throw new Error('Please wait a moment before sending another message.')
    }
  } catch {
    /* storage unavailable — server-side limits still apply */
  }

  if (!supabase) {
    const key = 'mahesh-portfolio-local-messages-v1'
    const rows = JSON.parse(localStorage.getItem(key) || '[]')
    rows.unshift({ id: `message-${Date.now()}`, ...trimmed, created_at: new Date().toISOString(), is_read: false })
    localStorage.setItem(key, JSON.stringify(rows))
    localStorage.setItem(CONTACT_LIMIT_KEY, String(Date.now()))
    return { ok: true }
  }

  const { error } = await supabase.from('contact_messages').insert({
    name: trimmed.name,
    email: trimmed.email,
    message: trimmed.message,
    user_agent: navigator.userAgent.slice(0, 300),
  })

  if (error) {
    if (/rate|limit|too many/i.test(error.message)) {
      throw new Error('Too many messages from this network. Please try again later.')
    }
    throw new Error('The message could not be sent. Please email directly instead.')
  }

  try {
    localStorage.setItem(CONTACT_LIMIT_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
  return { ok: true }
}

export async function fetchContactMessages() {
  if (!supabase) { try { return JSON.parse(localStorage.getItem('mahesh-portfolio-local-messages-v1') || '[]') } catch { return [] } }
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return asArray(data)
}

export async function markMessageRead(id, read = true) {
  if (!supabase) { const key = 'mahesh-portfolio-local-messages-v1'; const rows = await fetchContactMessages(); localStorage.setItem(key, JSON.stringify(rows.map((row) => row.id === id ? { ...row, is_read: read } : row))); return }
  const { error } = await supabase.from('contact_messages').update({ is_read: read }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteMessage(id) {
  if (!supabase) { const key = 'mahesh-portfolio-local-messages-v1'; const rows = await fetchContactMessages(); localStorage.setItem(key, JSON.stringify(rows.filter((row) => row.id !== id))); return }
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export { ADMIN_TABLES }
