export default function ProgressBar({ progress }) {
  return (
    <div className="w-full h-1 bg-compass-border">
      <div
        className="h-full bg-compass-accent transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
