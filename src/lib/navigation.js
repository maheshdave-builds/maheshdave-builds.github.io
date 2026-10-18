// Navigation models shared by the public header, footer and admin sidebar.
// Kept outside component files so editing a link does not affect fast refresh.

export const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Toolkit', href: '#expertise' },
  { label: 'Education', href: '#education' },
  { label: 'Notes', href: '#blog' },
  { label: 'Contact', href: '#contact' },
]

export const ADMIN_NAV = [
  { key: 'overview', path: '/admin', label: 'Overview' },
  { key: 'profile', path: '/admin/profile', label: 'Profile & about' },
  { key: 'content', path: '/admin/content', label: 'Page content' },
  { key: 'structure', path: '/admin/structure', label: 'Page structure' },
  { key: 'projects', path: '/admin/projects', label: 'Projects', countKey: 'projects' },
  { key: 'experience', path: '/admin/experience', label: 'Experience', countKey: 'experience' },
  { key: 'certifications', path: '/admin/certifications', label: 'Certifications', countKey: 'certifications' },
  { key: 'education', path: '/admin/education', label: 'Education', countKey: 'education' },
  { key: 'blog', path: '/admin/blog', label: 'Articles', countKey: 'posts' },
  { key: 'messages', path: '/admin/messages', label: 'Messages' },
  { key: 'theme', path: '/admin/theme', label: 'Theme & branding' },
  { key: 'settings', path: '/admin/settings', label: 'Site settings' },
]
