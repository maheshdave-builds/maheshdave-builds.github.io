import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'

export default function AboutSection({ profile }) {
  return (
    <section id="about" className="section-shell">
      <div className="container-shell">
        <SectionHeading title={profile.aboutSection.title} description={profile.aboutSection.description} />
        <div className="mt-12 grid gap-10 lg:grid-cols-[340px,1fr] lg:items-start">
          <Reveal>
            <div className="gradient-border-card overflow-hidden rounded-3xl p-1">
              <img
                src={profile.profileImage}
                alt={`${profile.name} portrait`}
                className="h-full w-full rounded-[1.35rem] object-cover"
              />
            </div>
          </Reveal>

          <div className="space-y-4">
            <Reveal delay={0.08}>
              <p className="text-lg text-slate-200 sm:text-xl">{profile.about.bio}</p>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="text-slate-300">{profile.about.focus}</p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-slate-300">{profile.about.summary}</p>
            </Reveal>

            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <Reveal delay={0.24}>
                <div className="glass-panel rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/85">Location</p>
                  <p className="mt-2 text-sm text-slate-100">{profile.location}</p>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="glass-panel rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/85">Availability</p>
                  <p className="mt-2 text-sm text-slate-100">{profile.availability}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
