export default function MilestoneTimeline({ milestones }) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-compass-success/30" />
      {milestones.map((m, i) => (
        <div key={i} className="relative mb-6 last:mb-0">
          <div className="absolute -left-5 w-6 h-6 rounded-full bg-compass-surface border-2 border-compass-success flex items-center justify-center">
            <span className="text-xs text-compass-success font-bold">{m.week}</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-semibold text-compass-text mb-1">{m.title}</p>
            <p className="text-xs text-compass-muted leading-relaxed">{m.action}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
