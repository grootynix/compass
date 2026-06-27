import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatBubble from '../components/ChatBubble'
import TypingIndicator from '../components/TypingIndicator'
import ProgressBar from '../components/ProgressBar'
import { sendMessage, generateRoadmap } from '../api/client'

const SESSION_KEY = 'compass_session_id'

export default function IntakePage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [buildingRoadmap, setBuildingRoadmap] = useState(false)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  const sessionId = localStorage.getItem(SESSION_KEY)

  useEffect(() => {
    if (!sessionId) return
    if (messages.length === 0) {
      initChat()
    }
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function initChat() {
    setLoading(true)
    try {
      const res = await sendMessage(sessionId, '__init__')
      setMessages([{ role: 'assistant', content: res.data.reply }])
      setProgress(res.data.progress)
    } catch {
      setMessages([{ role: 'assistant', content: "Hi! I'm having a bit of trouble right now. Please refresh and try again." }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await sendMessage(sessionId, userMsg)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
      setProgress(res.data.progress)

      if (res.data.intake_complete) {
        setProgress(100)
        setBuildingRoadmap(true)
        try {
          await generateRoadmap(sessionId)
          navigate('/roadmap')
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Something went wrong generating your roadmap. Your conversation is saved — please try refreshing.' },
          ])
          setBuildingRoadmap(false)
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-compass-bg">
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-compass-border">
          <span className="text-xl font-semibold text-compass-text tracking-tight">
            compass<span className="text-compass-accent">.</span>
          </span>
        </div>
        <ProgressBar progress={progress} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && !buildingRoadmap && <TypingIndicator />}
        {buildingRoadmap && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 bg-compass-surface border border-compass-border rounded-2xl px-6 py-4">
              <div className="w-5 h-5 border-2 border-compass-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-compass-text font-medium">Building your roadmap...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-compass-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading || buildingRoadmap}
            placeholder="Tell me about yourself..."
            className="flex-1 bg-compass-surface border border-compass-border rounded-xl px-4 py-3 text-compass-text placeholder-compass-muted text-sm outline-none focus:border-compass-accent transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || buildingRoadmap || !input.trim()}
            className="bg-compass-accent hover:bg-compass-accent-bright disabled:opacity-40 text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
