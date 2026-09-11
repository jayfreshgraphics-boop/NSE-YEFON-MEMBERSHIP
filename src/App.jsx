import { useEffect, useState } from 'react'
import RegistrationForm from './RegistrationForm'
import StatusPage from './StatusPage'
import AdminDashboard from './AdminDashboard'
import './App.css'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHashRoute()
  const [submittedId, setSubmittedId] = useState(null)

  const isAdmin = hash === '#admin'
  const statusIdFromHash = hash.startsWith('#status/') ? hash.replace('#status/', '') : null

  function handleSubmitted(id) {
    setSubmittedId(id)
    window.location.hash = `#status/${id}`
  }

  const activeStatusId = submittedId || statusIdFromHash

  return (
    <div className="page">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">NSE</span>
          <div>
            <div className="brand-title">Ikeja Branch</div>
            <div className="brand-sub">Graduate Member Onboarding</div>
          </div>
        </div>
      </header>

      <main className="content">
        {isAdmin ? (
          <AdminDashboard />
        ) : activeStatusId ? (
          <StatusPage memberId={activeStatusId} />
        ) : (
          <>
            <div className="intro">
              <h1>Welcome, new graduate engineer.</h1>
              <p>Complete these four steps to confirm your membership with NSE Ikeja Branch YEFON.</p>
            </div>
            <RegistrationForm onSubmitted={handleSubmitted} />
          </>
        )}
      </main>

      <footer className="site-footer">
        <span>NSE Ikeja Branch — The Branch to Beat</span>
      </footer>
    </div>
  )
}
