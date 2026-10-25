// Navigation models shared by the public header, footer and admin sidebar.
// Kept outside component files so editing a link does not affect fast refresh.

export const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Toolkit', href: '#expertise' },
  { label: 'Education', href: '#education' },
  { label: 'Articles', href: '#articles' },
  { label: 'Contact', href: '#contact' },
]

export const ADMIN_NAV = [
  { key: 'overview', path: '/mdadmin', label: 'Overview' },
  { key: 'profile', path: '/mdadmin/profile', label: 'Profile & about' },
  { key: 'content', path: '/mdadmin/content', label: 'Page content' },
  { key: 'structure', path: '/mdadmin/structure', label: 'Page structure' },
  { key: 'projects', path: '/mdadmin/projects', label: 'Projects', countKey: 'projects' },
  { key: 'experience', path: '/mdadmin/experience', label: 'Experience', countKey: 'experience' },
  { key: 'certifications', path: '/mdadmin/certifications', label: 'Certifications', countKey: 'certifications' },
  { key: 'education', path: '/mdadmin/education', label: 'Education', countKey: 'education' },
  { key: 'articles', path: '/mdadmin/articles', label: 'Articles', countKey: 'articles' },
  { key: 'messages', path: '/mdadmin/messages', label: 'Messages' },
  { key: 'theme', path: '/mdadmin/theme', label: 'Theme & branding' },
  { key: 'settings', path: '/mdadmin/settings', label: 'Site settings' },
]
