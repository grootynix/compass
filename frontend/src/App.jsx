import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import IntakePage from './pages/IntakePage'
import RoadmapPage from './pages/RoadmapPage'
import { v4 as uuidv4 } from 'uuid'

const SESSION_KEY = 'compass_session_id'

function ensureSession() {
  if (!localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, uuidv4())
  }
}

ensureSession()

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntakePage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
