import React from 'react';
import { Briefcase, GraduationCap, Award, CheckCircle2, Calendar, MapPin, Building, Sparkles } from 'lucide-react';
import { experienceData, educationData, leadershipAndAchievements } from '../data/portfolioData';

export default function Experience({ playSound }) {
  return (
    <section id="experience" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-3">
          <Briefcase className="w-3.5 h-3.5" />
          TRACK RECORD & ACADEMICS
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Industry Systems & <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Academic Rigor</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base font-light">
          Engineering scalable ERP architectures, supply chain automation, and high-performance Big Data systems.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Industry Experience */}
        <div>
          <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2.5">
            <Building className="w-5 h-5 text-cyan-400" />
            <span>Industry Systems Experience</span>
          </h3>

          <div className="space-y-6">
            {experienceData.map((exp, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-6 sm:p-7 border-l-4 border-l-cyan-400 relative">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {exp.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {exp.period}
                  </span>
                </div>

                <h4 className="text-xl font-display font-bold text-white mb-1">
                  {exp.role}
                </h4>
                <div className="text-sm font-mono text-cyan-400 mb-4 flex items-center gap-2">
                  <span>{exp.company}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {exp.location}
                  </span>
                </div>

                <ul className="space-y-3 mb-6">
                  {exp.highlights.map((highlight, hIdx) => (
                    <li key={hIdx} className="text-xs sm:text-sm text-slate-300 font-light flex items-start gap-2.5 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-800">
                  {exp.skills.map((skill) => (
                    <span key={skill} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Academic Rigor */}
        <div>
          <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-purple-400" />
            <span>Academic Background</span>
          </h3>

          <div className="space-y-6">
            {educationData.map((edu, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-6 sm:p-7 border-l-4 border-l-purple-400">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                    {edu.grade}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {edu.period}
                  </span>
                </div>

                <h4 className="text-xl font-display font-bold text-white mb-1">
                  {edu.degree}
                </h4>
                <p className="text-sm font-semibold text-purple-300 mb-1">
                  {edu.field}
                </p>
                <div className="text-xs font-mono text-slate-400 mb-5 flex items-center gap-2">
                  <span>{edu.institution}</span>
                  <span className="text-slate-600">•</span>
                  <span>{edu.location}</span>
                </div>

                <div className="mb-5">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Key Coursework
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {edu.coursework.map((course) => (
                      <span key={course} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Specialized Research Focus
                  </h5>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {edu.researchFocus}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Leadership & Extra Initiatives */}
          <div className="mt-8">
            <h4 className="text-base font-display font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Leadership & Core Milestones</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {leadershipAndAchievements.map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs font-bold text-amber-300 font-mono mb-1">{item.badge}</div>
                  <div className="text-xs text-slate-300 leading-relaxed font-light">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
