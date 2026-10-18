import { supabase, isConfigured } from './supabase'
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

export const contentSource = isConfigured ? 'supabase' : 'local'

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
  }
}

export function themeFromSettings(rows = []) {
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  const { theme } = validateTheme(map.theme_published || DEFAULT_THEME)
  return theme
}

/* -------------------------------------------------------------- public read */

export async function fetchPublicContent() {
  if (!supabase) return fallbackContent

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
      .in('key', ['site_title', 'branding', 'copy', 'stats', 'tech_stack', 'theme_published']),
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
  if (!supabase) return { ...fallbackContent, themeDraft: DEFAULT_THEME, themePublished: DEFAULT_THEME }

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
  if (!supabase) throw new Error('Supabase is not configured.')
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
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!id || String(id).startsWith('seed-')) {
    throw new Error('Bundled sample content cannot be deleted from the database; hide it instead.')
  }
  const { error } = await supabase.from(tableFor[collection]).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function saveProfile(profile) {
  if (!supabase) throw new Error('Supabase is not configured.')
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
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
}

export async function saveSiteSettings(site) {
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
  if (!supabase) throw new Error('Supabase is not configured; image upload requires storage.')
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
    // Static mode has no inbox. Point the visitor at email rather than pretending.
    throw new Error(`The form is not connected yet. Please email ${seedSite.contactEmail} directly.`)
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
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return asArray(data)
}

export async function markMessageRead(id, read = true) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('contact_messages').update({ is_read: read }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteMessage(id) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export { ADMIN_TABLES }
