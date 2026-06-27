import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API error:', err?.response?.data || err.message)
    return Promise.reject(err)
  }
)

export const sendMessage = (sessionId, message) =>
  api.post('/api/chat', { session_id: sessionId, message })

export const generateRoadmap = (sessionId) =>
  api.post('/api/roadmap/generate', { session_id: sessionId })

export const getRoadmap = (sessionId) =>
  api.get(`/api/roadmap/${sessionId}`)

export const getSession = (sessionId) =>
  api.get(`/api/session/${sessionId}`)

export default api
