import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RoadmapCard from '../components/RoadmapCard'
import { getRoadmap } from '../api/client'

const SESSION_KEY = 'compass_session_id'

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const sessionId = localStorage.getItem(SESSION_KEY)

  useEffect(() => {
    if (!sessionId) {
      navigate('/')
      return
    }
    getRoadmap(sessionId)
      .then((res) => setRoadmap(res.data))
      .catch(() => setError('Could not load your roadmap. Your conversation is saved — please try refreshing.'))
  }, [sessionId])

  function handleStartOver() {
    localStorage.removeItem(SESSION_KEY)
    navigate('/')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-compass-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-compass-muted mb-4">{error}</p>
          <button onClick={handleStartOver} className="bg-compass-accent text-white rounded-xl px-6 py-3 text-sm font-medium">
            Start Over
          </button>
        </div>
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-compass-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-compass-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-compass-muted">Loading your roadmap...</span>
        </div>
      </div>
    )
  }

  const sortedPaths = [...(roadmap.paths || [])].sort((a, b) => b.fit_score - a.fit_score)

  return (
    <div className="min-h-screen bg-compass-bg">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-3">
          <span className="text-compass-accent text-sm font-medium tracking-wide uppercase">Your Compass Roadmap</span>
        </div>
        <h1 className="text-4xl font-bold text-compass-text mb-4 leading-tight">{roadmap.title}</h1>
        <p className="text-compass-muted text-lg leading-relaxed mb-6">{roadmap.summary}</p>

        <div className="bg-compass-surface border border-compass-border rounded-xl px-5 py-4 mb-8">
          <p className="text-sm text-compass-muted">{roadmap.city_note}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-12">
          {[
            { label: 'Month 1', value: roadmap.income_timeline?.month_1_target },
            { label: 'Month 3', value: roadmap.income_timeline?.month_3_target },
            { label: 'Month 12', value: roadmap.income_timeline?.month_12_target },
          ].map((t) => (
            <div key={t.label} className="bg-compass-surface border border-compass-border rounded-xl p-4 text-center">
              <p className="text-xs text-compass-muted mb-1">{t.label}</p>
              <p className="text-xl font-bold text-compass-text">{t.value}</p>
            </div>
          ))}
        </div>
        {roadmap.income_timeline?.note && (
          <p className="text-xs text-compass-muted mb-10 -mt-8">{roadmap.income_timeline.note}</p>
        )}

        <h2 className="text-2xl font-bold text-compass-text mb-6">Your Paths</h2>
        <div className="space-y-6 mb-16">
          {sortedPaths.map((path) => (
            <RoadmapCard
              key={path.id}
              path={path}
              isRecommended={path.id === roadmap.recommended_path_id}
            />
          ))}
        </div>

        {roadmap.encouragement && (
          <div className="border-t border-compass-border pt-10 mb-12">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-compass-surface border border-compass-border flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#7C6FCD" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="2" fill="#7C6FCD"/>
                  <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="#7C6FCD" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-compass-muted text-lg italic leading-relaxed">{roadmap.encouragement}</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleStartOver}
            className="bg-compass-surface border border-compass-border hover:border-compass-accent text-compass-text rounded-xl px-8 py-3 text-sm font-medium transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  )
}
