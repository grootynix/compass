import { useState } from 'react'
import MilestoneTimeline from './MilestoneTimeline'
import SkillTag from './SkillTag'

function FitDots({ score }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`text-xs ${i < score ? 'text-compass-accent' : 'text-compass-border'}`}
        >
          ●
        </span>
      ))}
    </div>
  )
}

function EffortBadge({ level }) {
  const colors = {
    low: 'bg-compass-success/20 text-compass-success',
    medium: 'bg-compass-warning/20 text-compass-warning',
    high: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[level] || colors.medium}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} effort
    </span>
  )
}

export default function RoadmapCard({ path, isRecommended }) {
  const [expanded, setExpanded] = useState(isRecommended)

  return (
    <div
      className={`rounded-2xl border ${
        isRecommended ? 'border-compass-accent shadow-lg shadow-compass-accent/10' : 'border-compass-border'
      } bg-compass-surface overflow-hidden`}
    >
      {isRecommended && (
        <div className="bg-compass-accent/20 border-b border-compass-accent/30 px-4 py-1.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-compass-accent-bright tracking-wide uppercase">
            ★ Best Match
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-compass-text">{path.title}</h3>
          <EffortBadge level={path.effort_level} />
        </div>

        <FitDots score={path.fit_score} />

        <p className="text-sm text-compass-muted mt-3 mb-4 leading-relaxed">{path.why_this_fits}</p>

        <div className="flex gap-3 flex-wrap mb-4">
          <div className="bg-compass-bg rounded-lg px-3 py-2 text-xs">
            <span className="text-compass-muted block mb-0.5">First income</span>
            <span className="text-compass-text font-medium">{path.time_to_first_income}</span>
          </div>
          <div className="bg-compass-bg rounded-lg px-3 py-2 text-xs">
            <span className="text-compass-muted block mb-0.5">Income potential</span>
            <span className="text-compass-text font-medium">{path.income_potential}</span>
          </div>
        </div>

        <div className="bg-compass-accent/10 border border-compass-accent/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-compass-accent uppercase tracking-wide mb-1">First step today</p>
          <p className="text-sm text-compass-text leading-relaxed">{path.first_step_today}</p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-sm text-compass-accent hover:text-compass-accent-bright transition-colors py-2 font-medium"
        >
          {expanded ? 'Hide roadmap ↑' : 'See full roadmap ↓'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-compass-border px-5 pb-5 pt-4 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-compass-text mb-4">Week-by-week roadmap</h4>
            <MilestoneTimeline milestones={path.milestones} />
          </div>

          {path.platforms?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-compass-text mb-3">Platforms to use</h4>
              <div className="space-y-2">
                {path.platforms.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-compass-accent hover:text-compass-accent-bright font-medium min-w-fit"
                    >
                      {p.name}
                    </a>
                    <span className="text-compass-muted">{p.what_to_do}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {path.skill_gaps?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-compass-text mb-3">Skills to develop</h4>
              <div className="flex flex-wrap gap-2">
                {path.skill_gaps.map((g, i) => (
                  <SkillTag key={i} label={g} variant="gap" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
