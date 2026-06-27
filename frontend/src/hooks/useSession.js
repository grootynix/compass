import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '../api/client'

const SESSION_KEY = 'compass_session_id'

export function useSession() {
  const [sessionId, setSessionId] = useState(null)
  const [sessionState, setSessionState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      let id = localStorage.getItem(SESSION_KEY)
      if (id) {
        try {
          const res = await getSession(id)
          setSessionState(res.data)
          setSessionId(id)
        } catch {
          id = uuidv4()
          localStorage.setItem(SESSION_KEY, id)
          setSessionId(id)
          setSessionState({ exists: false, intake_complete: false, roadmap_ready: false })
        }
      } else {
        id = uuidv4()
        localStorage.setItem(SESSION_KEY, id)
        setSessionId(id)
        setSessionState({ exists: false, intake_complete: false, roadmap_ready: false })
      }
      setLoading(false)
    }
    init()
  }, [])

  function clearSession() {
    localStorage.removeItem(SESSION_KEY)
    const id = uuidv4()
    localStorage.setItem(SESSION_KEY, id)
    setSessionId(id)
    setSessionState({ exists: false, intake_complete: false, roadmap_ready: false })
  }

  return { sessionId, sessionState, loading, clearSession }
}
