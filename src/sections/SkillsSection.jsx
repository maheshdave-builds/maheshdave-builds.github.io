import { motion } from 'framer-motion'
import { getIconByName } from '../components/iconMap'
import SectionHeading from '../components/SectionHeading'

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function SkillsSection({ skills, sectionContent }) {
  return (
    <section id="skills" className="section-shell">
      <div className="container-shell">
        <SectionHeading title={sectionContent.title} description={sectionContent.description} />

        <motion.div
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {skills.map((skill) => {
            const Icon = getIconByName(skill.icon)

            return (
              <motion.article
                key={skill.name}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="gradient-border-card rounded-2xl p-5"
              >
                <div className="flex items-center gap-4">
                  <span className="icon-orb">
                    <Icon className="h-5 w-5 text-cyan-100" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-100">{skill.name}</h3>
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
