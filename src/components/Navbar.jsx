import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Navbar({ developerName, navItems }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className="container-shell">
        <div
          className={`rounded-2xl border transition-all duration-300 ${
            isScrolled
              ? 'border-white/15 bg-slate-900/70 shadow-[0_0_40px_rgba(56,189,248,0.12)] backdrop-blur-xl'
              : 'border-transparent bg-slate-950/45 backdrop-blur-sm'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <a href="#home" className="text-sm font-semibold tracking-[0.16em] text-slate-100 sm:text-base">
              {developerName}
            </a>
            <nav className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  whileHover={{ y: -1 }}
                  className="relative text-sm font-medium text-slate-200 transition-colors hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gradient-to-r after:from-cyan-300 after:to-fuchsia-400 after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-slate-900/70 text-slate-100 md:hidden"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
          <AnimatePresence>
            {isMenuOpen ? (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-t border-white/10 md:hidden"
              >
                <div className="space-y-1 px-4 py-4">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </motion.nav>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
