export default function SkillTag({ label, variant = 'skill' }) {
  const styles = {
    skill: 'bg-compass-accent/20 text-compass-accent-bright border border-compass-accent/30',
    gap: 'bg-compass-warning/20 text-compass-warning border border-compass-warning/30',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${styles[variant]}`}>
      {label}
    </span>
  )
}
