import { motion } from 'framer-motion'
import { getIconByName } from '../components/iconMap'
import SectionHeading from '../components/SectionHeading'

export default function TechStackSection({ stackItems, sectionContent }) {
  return (
    <section id="tech-stack" className="section-shell pt-0">
      <div className="container-shell">
        <SectionHeading title={sectionContent.title} description={sectionContent.description} />

        <motion.div
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.06,
              },
            },
          }}
        >
          {stackItems.map((stackItem) => {
            const Icon = getIconByName(stackItem.icon)

            return (
              <motion.div
                key={stackItem.name}
                className="glass-panel rounded-xl px-4 py-4 text-center"
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                whileHover={{ y: -3 }}
              >
                <span className="icon-orb mx-auto">
                  <Icon className="h-4 w-4 text-cyan-100" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-100">{stackItem.name}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
