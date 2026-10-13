import { motion } from 'framer-motion'
import { getIconByName } from '../components/iconMap'

export default function FooterSection({ profile }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative pb-10 pt-6">
      <div className="container-shell">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.14em] text-slate-100">{profile.name}</p>
            <p className="mt-1 text-xs text-slate-400">{profile.footerNote}</p>
          </div>
          <div className="flex items-center gap-2">
            {profile.socials.map((social) => {
              const Icon = getIconByName(social.icon)
              const isExternalLink = social.href.startsWith('http')

              return (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target={isExternalLink ? '_blank' : undefined}
                  rel={isExternalLink ? 'noreferrer' : undefined}
                  whileHover={{ y: -2 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/55 text-slate-200 transition hover:border-cyan-300/55 hover:text-cyan-100"
                  aria-label={social.name}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              )
            })}
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Copyright {currentYear} {profile.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
