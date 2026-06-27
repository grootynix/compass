const CompassIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#7C6FCD" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="2" fill="#7C6FCD"/>
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="#7C6FCD" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 9l6 3-6 3 3-6-3 6z" fill="#A89EE0"/>
  </svg>
)

export default function ChatBubble({ role, content }) {
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex items-start gap-3 mb-4 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-compass-surface border border-compass-border flex items-center justify-center mt-1">
          <CompassIcon />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAssistant
            ? 'bg-compass-surface text-compass-text rounded-tl-sm border border-compass-border'
            : 'bg-compass-accent text-white rounded-tr-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
