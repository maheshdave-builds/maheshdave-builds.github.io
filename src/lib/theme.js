// Central theme schema. Every colour, radius, shadow and motion value the site
// renders is declared here, converted to CSS custom properties, and applied to
// <html>. Components must never hardcode a colour; they read these variables.
//
// A theme object is stored in site_settings under `theme_published` (readable by
// everyone) and `theme_draft` (admin only). See supabase/schema.sql.

export const THEME_VERSION = 1

export const COLOR_KEYS = [
  { key: 'bg', label: 'Page background', group: 'Surfaces' },
  { key: 'surface', label: 'Card background', group: 'Surfaces' },
  { key: 'surfaceSoft', label: 'Subtle background', group: 'Surfaces' },
  { key: 'headerBg', label: 'Header background', group: 'Surfaces' },
  { key: 'footerBg', label: 'Footer background', group: 'Surfaces' },
  { key: 'text', label: 'Main text', group: 'Text' },
  { key: 'muted', label: 'Muted text', group: 'Text' },
  { key: 'line', label: 'Borders', group: 'Text' },
  { key: 'primary', label: 'Primary brand', group: 'Brand' },
  { key: 'primaryDark', label: 'Primary hover', group: 'Brand' },
  { key: 'secondary', label: 'Secondary brand', group: 'Brand' },
  { key: 'accent', label: 'Accent', group: 'Brand' },
  { key: 'onPrimary', label: 'Text on primary', group: 'Brand' },
  { key: 'link', label: 'Links', group: 'Brand' },
  { key: 'gradientFrom', label: 'Gradient start', group: 'Gradient' },
  { key: 'gradientTo', label: 'Gradient end', group: 'Gradient' },
]

export const FONT_STACKS = [
  { key: 'editorial', label: 'Editorial (Manrope + DM Sans)', heading: "'Manrope', sans-serif", body: "'DM Sans', sans-serif", mono: "'DM Mono', monospace" },
  { key: 'grotesk', label: 'Grotesk (system UI)', heading: "'Helvetica Neue', Arial, sans-serif", body: "'Helvetica Neue', Arial, sans-serif", mono: "ui-monospace, SFMono-Regular, monospace" },
  { key: 'serif', label: 'Serif display (Georgia)', heading: "Georgia, 'Times New Roman', serif", body: "'DM Sans', sans-serif", mono: "'DM Mono', monospace" },
  { key: 'mono', label: 'Technical (mono headings)', heading: "'DM Mono', ui-monospace, monospace", body: "'DM Sans', sans-serif", mono: "'DM Mono', monospace" },
]

export const SCALE_OPTIONS = [
  { key: 'compact', label: 'Compact', heading: 0.93, body: 0.95 },
  { key: 'comfortable', label: 'Comfortable', heading: 1, body: 1 },
  { key: 'generous', label: 'Generous', heading: 1.07, body: 1.04 },
]

export const PALETTES = {
  light: {
    bg: '#f7f8f5', surface: '#ffffff', surfaceSoft: '#eef2ed',
    headerBg: '#f7f8f5', footerBg: '#f7f8f5',
    text: '#1e2a24', muted: '#66736b', line: '#dfe6df',
    primary: '#426b50', primaryDark: '#2f503b', secondary: '#7a9b80', accent: '#b78b53',
    onPrimary: '#ffffff', link: '#3c6549',
    gradientFrom: '#294d36', gradientTo: '#5c805e',
  },
  dark: {
    bg: '#151b17', surface: '#1e2721', surfaceSoft: '#26332a',
    headerBg: '#151b17', footerBg: '#151b17',
    text: '#f2f5f0', muted: '#b5c0b7', line: '#39473d',
    primary: '#94b69b', primaryDark: '#c2d8c6', secondary: '#6e9478', accent: '#d4b17d',
    onPrimary: '#12211a', link: '#a8c9ae',
    gradientFrom: '#203a29', gradientTo: '#3f6147',
  },
}

const META = {
  version: THEME_VERSION,
  mode: 'system',
  fontFamily: 'editorial',
  scale: 'comfortable',
  radius: 14,
  shadow: 1,
  motion: 1,
}

export const DEFAULT_THEME = {
  ...META,
  light: { ...PALETTES.light },
  dark: { ...PALETTES.dark },
}

export const THEME_PRESETS = [
  { key: 'editorial', label: 'Editorial Green', description: 'The original identity — deep green, warm bronze, paper background.', theme: DEFAULT_THEME },
  {
    key: 'midnight', label: 'Midnight Slate', description: 'Cool slate base with an electric blue primary.',
    theme: {
      ...META, mode: 'dark', radius: 12,
      light: { ...PALETTES.light, bg: '#f6f8fb', surface: '#ffffff', surfaceSoft: '#eef2f7', headerBg: '#f6f8fb', footerBg: '#f6f8fb', text: '#17202b', muted: '#5d6b7c', line: '#dde5ee', primary: '#1f5f9e', primaryDark: '#164a7c', secondary: '#5b8cba', accent: '#c8863c', onPrimary: '#ffffff', link: '#1b548c', gradientFrom: '#16324d', gradientTo: '#2f6390' },
      dark: { ...PALETTES.dark, bg: '#0f151d', surface: '#17202b', surfaceSoft: '#202b38', headerBg: '#0f151d', footerBg: '#0f151d', text: '#eef3f9', muted: '#a3b0c0', line: '#2b3948', primary: '#7fb4e8', primaryDark: '#a8cdf4', secondary: '#5b8cba', accent: '#e0a75f', onPrimary: '#0b1622', link: '#8cc0f0', gradientFrom: '#11283d', gradientTo: '#2a567f' },
    },
  },
  {
    key: 'ink', label: 'Ink & Gold', description: 'Near-black surfaces with a restrained gold accent.',
    theme: {
      ...META, mode: 'dark', radius: 6, fontFamily: 'serif',
      light: { ...PALETTES.light, bg: '#faf8f3', surface: '#ffffff', surfaceSoft: '#f2eee4', headerBg: '#faf8f3', footerBg: '#faf8f3', text: '#1c1a16', muted: '#6d6659', line: '#e5dfd1', primary: '#3b3a35', primaryDark: '#24231f', secondary: '#8a8272', accent: '#a9832f', onPrimary: '#ffffff', link: '#57543f', gradientFrom: '#20201c', gradientTo: '#3d3b33' },
      dark: { ...PALETTES.dark, bg: '#121210', surface: '#1b1a17', surfaceSoft: '#252420', headerBg: '#121210', footerBg: '#121210', text: '#f4f1e8', muted: '#aba598', line: '#34322c', primary: '#d8c9a3', primaryDark: '#efe4c8', secondary: '#8a8272', accent: '#cfa94f', onPrimary: '#1a1915', link: '#d8c9a3', gradientFrom: '#1d1c18', gradientTo: '#3a3830' },
    },
  },
  {
    key: 'terracotta', label: 'Terracotta', description: 'Warm clay primary on a soft cream base.',
    theme: {
      ...META, mode: 'light', radius: 18,
      light: { ...PALETTES.light, bg: '#fbf7f3', surface: '#ffffff', surfaceSoft: '#f6ece4', headerBg: '#fbf7f3', footerBg: '#fbf7f3', text: '#2a211c', muted: '#7a6a5f', line: '#eadfd5', primary: '#a85434', primaryDark: '#853f25', secondary: '#c78b6b', accent: '#c9a227', onPrimary: '#ffffff', link: '#96482c', gradientFrom: '#6b3320', gradientTo: '#a85434' },
      dark: { ...PALETTES.dark, bg: '#181311', surface: '#221b18', surfaceSoft: '#2d241f', headerBg: '#181311', footerBg: '#181311', text: '#f6efe9', muted: '#bfada1', line: '#3d312a', primary: '#e0a588', primaryDark: '#f0c3ac', secondary: '#c78b6b', accent: '#e3c565', onPrimary: '#231511', link: '#e3b09a', gradientFrom: '#3a2118', gradientTo: '#6c3a26' },
    },
  },
  {
    key: 'mono', label: 'Strict Monochrome', description: 'No chroma — black, white and one grey ramp.',
    theme: {
      ...META, mode: 'light', radius: 4, fontFamily: 'grotesk',
      light: { bg: '#ffffff', surface: '#ffffff', surfaceSoft: '#f3f3f3', headerBg: '#ffffff', footerBg: '#ffffff', text: '#111111', muted: '#6a6a6a', line: '#dcdcdc', primary: '#111111', primaryDark: '#000000', secondary: '#666666', accent: '#888888', onPrimary: '#ffffff', link: '#111111', gradientFrom: '#1a1a1a', gradientTo: '#4a4a4a' },
      dark: { bg: '#0d0d0d', surface: '#171717', surfaceSoft: '#212121', headerBg: '#0d0d0d', footerBg: '#0d0d0d', text: '#f5f5f5', muted: '#a8a8a8', line: '#333333', primary: '#fafafa', primaryDark: '#ffffff', secondary: '#9a9a9a', accent: '#cfcfcf', onPrimary: '#0d0d0d', link: '#ffffff', gradientFrom: '#1c1c1c', gradientTo: '#454545' },
    },
  },

  {
    key: 'teal-harmony', label: 'Teal Harmony', description: 'Soft editorial neutrals with a muted teal identity and refined teal shadows.',
    theme: {
      ...META, mode: 'light', radius: 16,
      light: { ...PALETTES.light, bg: '#f5f8f7', surface: '#ffffff', surfaceSoft: '#eaf1f0', headerBg: '#f5f8f7', footerBg: '#f5f8f7', text: '#1b302f', muted: '#617775', line: '#d9e5e3', primary: '#628f8c', primaryDark: '#426f6c', secondary: '#98b7b3', accent: '#c49a70', onPrimary: '#ffffff', link: '#426f6c', gradientFrom: '#345f5c', gradientTo: '#83aaa6' },
      dark: { ...PALETTES.dark, bg: '#101c1c', surface: '#182827', surfaceSoft: '#213735', headerBg: '#101c1c', footerBg: '#101c1c', text: '#eef6f4', muted: '#b1c5c2', line: '#304946', primary: '#98c2bd', primaryDark: '#b7d8d4', secondary: '#628f8c', accent: '#dfb38a', onPrimary: '#10201f', link: '#a8d0cb', gradientFrom: '#1d3937', gradientTo: '#426f6c' },
    },
  },
  {
    key: 'ocean-blue', label: 'Ocean Blue', description: 'Clear blue accents, crisp surfaces and a calm dark mode.',
    theme: {
      ...META, mode: 'light', radius: 14,
      light: { ...PALETTES.light, bg: '#f4f8fc', surface: '#ffffff', surfaceSoft: '#e9f1f8', headerBg: '#f4f8fc', footerBg: '#f4f8fc', text: '#182b3c', muted: '#61778a', line: '#d9e5ef', primary: '#276b9b', primaryDark: '#1c5078', secondary: '#6c9fbd', accent: '#d49b58', onPrimary: '#ffffff', link: '#215e8a', gradientFrom: '#173c5b', gradientTo: '#3984b4' },
      dark: { ...PALETTES.dark, bg: '#101923', surface: '#182634', surfaceSoft: '#213546', headerBg: '#101923', footerBg: '#101923', text: '#eff6fb', muted: '#b0c0ce', line: '#304658', primary: '#82c2e8', primaryDark: '#b0dcf4', secondary: '#568db1', accent: '#e0b77c', onPrimary: '#10202d', link: '#91c9eb', gradientFrom: '#142f45', gradientTo: '#2f6b91' },
    },
  },
  {
    key: 'violet-night', label: 'Violet Night', description: 'A modern violet accent for a polished, dark-first portfolio.',
    theme: {
      ...META, mode: 'dark', radius: 16,
      light: { ...PALETTES.light, bg: '#f8f6fc', surface: '#ffffff', surfaceSoft: '#f0ebf8', headerBg: '#f8f6fc', footerBg: '#f8f6fc', text: '#29223a', muted: '#756b88', line: '#e5def0', primary: '#7654a6', primaryDark: '#5b3b88', secondary: '#a18ac4', accent: '#c49a70', onPrimary: '#ffffff', link: '#694795', gradientFrom: '#49316d', gradientTo: '#8967b8' },
      dark: { ...PALETTES.dark, bg: '#171321', surface: '#211b30', surfaceSoft: '#2b2340', headerBg: '#171321', footerBg: '#171321', text: '#f5f0fc', muted: '#c0b4d1', line: '#403451', primary: '#c2a7f0', primaryDark: '#d9c8fa', secondary: '#9273c0', accent: '#e1bb91', onPrimary: '#21152f', link: '#d0baf4', gradientFrom: '#302046', gradientTo: '#604487' },
    },
  },
  {
    key: 'rose-stone', label: 'Rose & Stone', description: 'Warm neutral backgrounds paired with restrained rose accents.',
    theme: {
      ...META, mode: 'light', radius: 18,
      light: { ...PALETTES.light, bg: '#faf6f5', surface: '#ffffff', surfaceSoft: '#f4eae8', headerBg: '#faf6f5', footerBg: '#faf6f5', text: '#302321', muted: '#7c6966', line: '#eadbd8', primary: '#a85f66', primaryDark: '#85464d', secondary: '#c18c90', accent: '#c49a70', onPrimary: '#ffffff', link: '#944e56', gradientFrom: '#63343a', gradientTo: '#b06b72' },
      dark: { ...PALETTES.dark, bg: '#1c1517', surface: '#291e21', surfaceSoft: '#35262a', headerBg: '#1c1517', footerBg: '#1c1517', text: '#f8eeee', muted: '#cbb8bb', line: '#493338', primary: '#dfa0a6', primaryDark: '#f0bdc1', secondary: '#a66d74', accent: '#e1bd91', onPrimary: '#281619', link: '#e7adb2', gradientFrom: '#43252b', gradientTo: '#774047' },
    },
  },
  {
    key: 'forest-moss', label: 'Forest & Moss', description: 'Deep botanical greens with a subtle moss and brass palette.',
    theme: {
      ...META, mode: 'light', radius: 12,
      light: { ...PALETTES.light, bg: '#f5f7f1', surface: '#ffffff', surfaceSoft: '#eaf0e2', headerBg: '#f5f7f1', footerBg: '#f5f7f1', text: '#202b20', muted: '#687666', line: '#dce5d6', primary: '#4f744b', primaryDark: '#365534', secondary: '#8ba17d', accent: '#b99757', onPrimary: '#ffffff', link: '#41633d', gradientFrom: '#263f25', gradientTo: '#63845a' },
      dark: { ...PALETTES.dark, bg: '#141b13', surface: '#1d281b', surfaceSoft: '#293725', headerBg: '#141b13', footerBg: '#141b13', text: '#f0f5ed', muted: '#b6c4b0', line: '#3a4935', primary: '#a7c69a', primaryDark: '#c5dcb9', secondary: '#78966b', accent: '#d6b879', onPrimary: '#172115', link: '#b5d3a8', gradientFrom: '#21351f', gradientTo: '#45663d' },
    },
  },

  {
    key: 'carbon-lime', label: 'Carbon & Lime', description: 'Modern charcoal surfaces with a restrained lime accent.',
    theme: { ...META, mode: 'dark', radius: 14,
      light: { ...PALETTES.light, bg: '#f6f7f3', surface: '#ffffff', surfaceSoft: '#edf0e7', headerBg: '#f6f7f3', footerBg: '#f6f7f3', text: '#20251c', muted: '#697064', line: '#dfe4d7', primary: '#536b2f', primaryDark: '#3e5123', secondary: '#9dbb62', accent: '#c58d4b', onPrimary: '#ffffff', link: '#4d642c', gradientFrom: '#29351b', gradientTo: '#718b3e' },
      dark: { ...PALETTES.dark, bg: '#11140f', surface: '#1a2016', surfaceSoft: '#242c1e', headerBg: '#11140f', footerBg: '#11140f', text: '#f2f5eb', muted: '#b3bda8', line: '#35402b', primary: '#c3e47b', primaryDark: '#d8f59b', secondary: '#8cae4e', accent: '#e0b77b', onPrimary: '#18200e', link: '#c9e88c', gradientFrom: '#1c2a14', gradientTo: '#435b28' } }
  },
  {
    key: 'blueprint', label: 'Blueprint Blue', description: 'Confident product-engineering blues with clean, cool neutrals.',
    theme: { ...META, mode: 'light', radius: 16,
      light: { ...PALETTES.light, bg: '#f3f7fb', surface: '#ffffff', surfaceSoft: '#e7eff7', headerBg: '#f3f7fb', footerBg: '#f3f7fb', text: '#17283b', muted: '#5e7288', line: '#d8e4ef', primary: '#2867a6', primaryDark: '#1c4d80', secondary: '#7aa9d4', accent: '#df9855', onPrimary: '#ffffff', link: '#215d97', gradientFrom: '#16395f', gradientTo: '#3f80b7' },
      dark: { ...PALETTES.dark, bg: '#0e1722', surface: '#172434', surfaceSoft: '#202f42', headerBg: '#0e1722', footerBg: '#0e1722', text: '#f0f6fc', muted: '#aebfd0', line: '#30445a', primary: '#8dc5f5', primaryDark: '#b7dcfa', secondary: '#5f94c4', accent: '#efb778', onPrimary: '#102032', link: '#9acdf5', gradientFrom: '#142d48', gradientTo: '#2e6595' } }
  },
  {
    key: 'plum-copper', label: 'Plum & Copper', description: 'Premium plum tones with copper highlights and soft editorial surfaces.',
    theme: { ...META, mode: 'dark', radius: 18,
      light: { ...PALETTES.light, bg: '#f8f5f8', surface: '#ffffff', surfaceSoft: '#f0e8f0', headerBg: '#f8f5f8', footerBg: '#f8f5f8', text: '#2a2030', muted: '#77677d', line: '#e5dbe8', primary: '#76507f', primaryDark: '#593a61', secondary: '#b397bd', accent: '#c18159', onPrimary: '#ffffff', link: '#694472', gradientFrom: '#412b49', gradientTo: '#8a6293' },
      dark: { ...PALETTES.dark, bg: '#17111a', surface: '#241b28', surfaceSoft: '#302437', headerBg: '#17111a', footerBg: '#17111a', text: '#f7f0f8', muted: '#c4b5c9', line: '#433348', primary: '#d1a9d9', primaryDark: '#e4c7e9', secondary: '#a27ba9', accent: '#e1a078', onPrimary: '#25162a', link: '#d8b7df', gradientFrom: '#30203a', gradientTo: '#65436e' } }
  }
] 

/* ------------------------------------------------------------------ colour */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHex(value) {
  return typeof value === 'string' && HEX.test(value.trim())
}

export function normalizeHex(value, fallback = '#000000') {
  if (!isHex(value)) return fallback
  let hex = value.trim().toLowerCase()
  if (hex.length === 4) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  return hex
}

export function hexToRgb(hex) {
  const value = normalizeHex(hex)
  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('')}`
}

/** Mix `amount` (0–1) of `to` into `from`. */
export function mix(from, to, amount) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  })
}

export function darken(color, amount = 0.18) {
  return mix(color, '#000000', amount)
}

export function lighten(color, amount = 0.18) {
  return mix(color, '#ffffff', amount)
}

function channel(c) {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.1 contrast ratio between two colours (1–21). */
export function contrastRatio(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/** Pick whichever of black/white reads better on `background`. */
export function readableOn(background) {
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#111111') ? '#ffffff' : '#111111'
}

/* ------------------------------------------------------------- validation */

export const LIMITS = { radius: [0, 32], shadow: [0, 2], motion: [0, 1] }

function clampNumber(value, [min, max], fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/**
 * Validate an arbitrary object into a safe theme. Unknown keys are dropped, so a
 * tampered payload can never inject CSS. Returns `{ theme, errors }` where errors
 * are human-readable and non-blocking (the theme is always usable).
 */
export function validateTheme(input) {
  const errors = []
  const source = input && typeof input === 'object' ? input : {}
  const theme = { ...DEFAULT_THEME }

  theme.version = THEME_VERSION
  theme.mode = ['light', 'dark', 'system'].includes(source.mode) ? source.mode : DEFAULT_THEME.mode
  theme.fontFamily = FONT_STACKS.some((f) => f.key === source.fontFamily) ? source.fontFamily : DEFAULT_THEME.fontFamily
  theme.scale = SCALE_OPTIONS.some((s) => s.key === source.scale) ? source.scale : DEFAULT_THEME.scale
  theme.radius = clampNumber(source.radius, LIMITS.radius, DEFAULT_THEME.radius)
  theme.shadow = clampNumber(source.shadow, LIMITS.shadow, DEFAULT_THEME.shadow)
  theme.motion = clampNumber(source.motion, LIMITS.motion, DEFAULT_THEME.motion)

  for (const mode of ['light', 'dark']) {
    const palette = source[mode] && typeof source[mode] === 'object' ? source[mode] : {}
    theme[mode] = {}
    for (const { key, label } of COLOR_KEYS) {
      const raw = palette[key]
      if (raw === undefined) {
        theme[mode][key] = DEFAULT_THEME[mode][key]
        continue
      }
      if (!isHex(raw)) {
        errors.push(`${label} (${mode}) is not a valid hex colour; using the default.`)
        theme[mode][key] = DEFAULT_THEME[mode][key]
      } else {
        theme[mode][key] = normalizeHex(raw)
      }
    }
  }

  return { theme, errors }
}

/** Contrast problems worth blocking a publish for. */
export function contrastIssues(theme) {
  const issues = []
  for (const mode of ['light', 'dark']) {
    const p = theme[mode]
    const body = contrastRatio(p.text, p.bg)
    const muted = contrastRatio(p.muted, p.bg)
    const button = contrastRatio(p.onPrimary, p.primary)
    const card = contrastRatio(p.text, p.surface)
    if (body < 4.5) issues.push(`${mode}: body text on background is ${body.toFixed(2)}:1 — needs 4.5:1 for WCAG AA.`)
    if (card < 4.5) issues.push(`${mode}: body text on cards is ${card.toFixed(2)}:1 — needs 4.5:1 for WCAG AA.`)
    if (muted < 3) issues.push(`${mode}: muted text is ${muted.toFixed(2)}:1 — needs at least 3:1.`)
    if (button < 3) issues.push(`${mode}: button label contrast is ${button.toFixed(2)}:1 — needs at least 3:1.`)
  }
  return issues
}

/* ------------------------------------------------------------ application */

export function fontFor(key) {
  return FONT_STACKS.find((f) => f.key === key) || FONT_STACKS[0]
}

export function scaleFor(key) {
  return SCALE_OPTIONS.find((s) => s.key === key) || SCALE_OPTIONS[1]
}

/**
 * Convert a theme into the CSS custom properties the stylesheet consumes.
 * Values are always validated hex colours or clamped numbers, so this is the
 * only place colours enter the DOM.
 */
export function toCssVariables(theme, mode) {
  const palette = theme[mode] || theme.light
  const font = fontFor(theme.fontFamily)
  const scale = scaleFor(theme.scale)
  const shadowAlpha = 0.03 + theme.shadow * 0.075
  const radius = `${theme.radius}px`

  return {
    '--bg': palette.bg,
    '--surface': palette.surface,
    '--surface-soft': palette.surfaceSoft,
    '--header-bg': palette.headerBg,
    '--footer-bg': palette.footerBg,
    '--text': palette.text,
    '--muted': palette.muted,
    '--line': palette.line,
    '--green': palette.primary,
    '--green-dark': palette.primaryDark,
    '--secondary': palette.secondary,
    '--bronze': palette.accent,
    '--on-primary': palette.onPrimary,
    '--link': palette.link,
    '--grad-a': palette.gradientFrom,
    '--grad-b': palette.gradientTo,
    '--shadow': `0 16px 48px rgb(98 143 140 / ${(Math.min(0.7, shadowAlpha + 0.12)).toFixed(3)})`,
    '--shadow-sm': `0 6px 20px rgb(98 143 140 / ${(Math.min(0.42, shadowAlpha * 0.55 + 0.06)).toFixed(3)})`,
    '--radius': radius,
    '--radius-sm': `${Math.max(0, theme.radius - 6)}px`,
    '--radius-lg': `${theme.radius + 6}px`,
    '--font-heading': font.heading,
    '--font-body': font.body,
    '--font-mono': font.mono,
    '--heading-scale': String(scale.heading),
    '--body-scale': String(scale.body),
    '--motion': String(theme.motion),
    'color-scheme': mode,
  }
}

export function applyTheme(theme, element) {
  const root = element || (typeof document !== 'undefined' ? document.documentElement : null)
  if (!root) return
  const resolved = resolveMode(theme.mode)
  root.dataset.theme = resolved
  root.dataset.motion = Number(theme.motion) <= 0.05 ? 'off' : 'on'
  const vars = toCssVariables(theme, resolved)
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
}

export function resolveMode(mode) {
  if (mode === 'light' || mode === 'dark') return mode
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
