import { motion } from 'framer-motion'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'

export default function ExperienceSection({ experienceItems, sectionContent }) {
  return (
    <section id="experience" className="section-shell">
      <div className="container-shell">
        <SectionHeading title={sectionContent.title} description={sectionContent.description} />

        <div className="relative mt-12 pl-8 sm:pl-12">
          <motion.div
            className="absolute left-[9px] top-3 h-[calc(100%-1rem)] w-px origin-top bg-gradient-to-b from-cyan-300 via-indigo-400 to-fuchsia-500 sm:left-[13px]"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="space-y-6">
            {experienceItems.map((item, index) => (
              <Reveal key={`${item.company}-${item.role}`} delay={index * 0.08} className="relative">
                <span className="absolute -left-[1.95rem] top-8 h-3.5 w-3.5 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.85)] sm:-left-[2.65rem]" />
                <article className="gradient-border-card rounded-2xl p-6 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/90">
                    {item.duration}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-100">{item.role}</h3>
                  <p className="mt-1 text-sm text-slate-300">{item.company}</p>
                  <p className="mt-4 text-sm text-slate-300">{item.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
