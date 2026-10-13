import { motion } from 'framer-motion'
import GradientButton from '../components/GradientButton'
import { getIconByName } from '../components/iconMap'

const floatingShapes = [
  {
    className: '-left-24 top-8 h-64 w-64 bg-cyan-400/24',
    x: 24,
    y: -18,
    duration: 11,
  },
  {
    className: 'right-0 top-24 h-72 w-72 bg-fuchsia-400/20',
    x: -28,
    y: 20,
    duration: 14,
  },
  {
    className: 'left-[36%] bottom-0 h-56 w-56 bg-indigo-400/25',
    x: 18,
    y: -24,
    duration: 10,
  },
]

export default function HeroSection({ profile }) {
  return (
    <section id="home" className="relative isolate overflow-hidden pt-28 sm:pt-32">
      <motion.div
        aria-hidden="true"
        className="hero-gradient absolute inset-0 -z-20"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_46%)] opacity-40"
      />
      {floatingShapes.map((shape, index) => (
        <motion.div
          key={shape.className}
          aria-hidden="true"
          className={`floating-shape absolute rounded-full blur-3xl ${shape.className} ${
            index === 1 ? 'hidden sm:block' : ''
          }`}
          animate={{
            x: [0, shape.x, 0],
            y: [0, shape.y, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: shape.duration, ease: 'easeInOut', repeat: Infinity }}
        />
      ))}

      <div className="container-shell flex flex-col gap-12 py-10 lg:min-h-[calc(100vh-7rem)] lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/90"
          >
            {profile.location}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="mt-4 max-w-4xl text-4xl font-semibold sm:text-6xl lg:text-7xl"
          >
            <span className="animated-gradient-text">{profile.name}</span>
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16 }}
            className="mt-4 text-lg font-medium text-slate-200 sm:text-2xl"
          >
            {profile.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.22 }}
            className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg"
          >
            {profile.intro}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <GradientButton href="#projects">{profile.cta.primary}</GradientButton>
            <GradientButton href="#contact" variant="outline">
              {profile.cta.secondary}
            </GradientButton>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.36 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
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
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/55 px-4 py-2 text-xs font-medium text-slate-200 backdrop-blur-lg transition-colors hover:border-cyan-300/55 hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {social.name}
                </motion.a>
              )
            })}
          </motion.div>
        </div>
        <motion.div
          className="relative flex justify-center lg:flex-none lg:justify-end"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2.5rem] bg-[conic-gradient(from_120deg,rgba(34,211,238,0.25),rgba(129,140,248,0.28),rgba(244,114,182,0.25),rgba(34,211,238,0.25))] blur-3xl"
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute -inset-2 rounded-[2.1rem] border border-white/15"
            animate={{ rotate: [0, 2, 0, -2, 0] }}
            transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
          />
        </motion.div>
      </div>
    </section>
  )
}
