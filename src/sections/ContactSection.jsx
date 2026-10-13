import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { useState } from 'react'
import GradientButton from '../components/GradientButton'
import { getIconByName } from '../components/iconMap'
import SectionHeading from '../components/SectionHeading'

const initialState = {
  name: '',
  email: '',
  message: '',
}

export default function ContactSection({ profile }) {
  const [formState, setFormState] = useState(initialState)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setIsSubmitted(false)
    setFormState((prevState) => ({ ...prevState, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitted(true)
    setFormState(initialState)
  }

  return (
    <section id="contact" className="section-shell">
      <div className="container-shell">
        <SectionHeading title={profile.contactSection.title} description={profile.contactSection.description} />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55 }}
            className="space-y-4"
          >
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/90">Email</p>
              <a
                className="mt-2 block text-sm text-slate-100 hover:text-cyan-100"
                href={`mailto:${profile.email}`}
              >
                {profile.email}
              </a>
            </div>
            <div className="space-y-3">
              {profile.socials.map((social) => {
                const Icon = getIconByName(social.icon)
                const isExternalLink = social.href.startsWith('http')

                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target={isExternalLink ? '_blank' : undefined}
                    rel={isExternalLink ? 'noreferrer' : undefined}
                    className="glass-panel flex items-center gap-3 rounded-2xl p-4 transition hover:border-cyan-300/45"
                  >
                    <span className="icon-orb">
                      <Icon className="h-4 w-4 text-cyan-100" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{social.name}</p>
                      <p className="text-xs text-slate-400">{social.href.replace('mailto:', '')}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            onSubmit={handleSubmit}
            className="gradient-border-card rounded-2xl p-6 sm:p-7"
          >
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">
                Name
                <input
                  name="name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={handleChange}
                  className="contact-input mt-2"
                  placeholder="Your name"
                />
              </label>
              <label className="block text-sm font-medium text-slate-200">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={handleChange}
                  className="contact-input mt-2"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm font-medium text-slate-200">
                Message
                <textarea
                  name="message"
                  required
                  rows="5"
                  value={formState.message}
                  onChange={handleChange}
                  className="contact-input mt-2 resize-y"
                  placeholder="Tell me about your project..."
                />
              </label>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <GradientButton type="submit" className="w-full sm:w-auto">
                <span className="inline-flex items-center gap-2">
                  Send Message
                  <Send className="h-4 w-4" />
                </span>
              </GradientButton>
              {isSubmitted ? (
                <p className="text-xs text-emerald-300">
                  Message sent in UI demo mode. Connect this form to your backend.
                </p>
              ) : null}
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  )
}
