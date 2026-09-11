import { useEffect, useState } from 'react'
import RegistrationForm from './RegistrationForm'
import StatusPage from './StatusPage'
import AdminDashboard from './AdminDashboard'
import nationalLogo from './assets/national-logo.png'
import branchLogo from './assets/branch-logo.png'
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
          <img src={nationalLogo} alt="Nigerian Society of Engineers" className="brand-logo" />
          <div className="brand-text">
            <div className="brand-title">The Nigerian Society of Engineers</div>
            <div className="brand-branch">IKEJA BRANCH</div>
            <div className="brand-sub">Graduate Member Onboarding</div>
          </div>
          <img src={branchLogo} alt="NSE Ikeja Branch" className="brand-logo" />
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
        <div>NSE Ikeja Branch — The Branch to Beat</div>
        <div className="footer-signature">© 2026 JayFresh Automation — Designed by Olonade Julius Olabisi</div>
      </footer>
    </div>
  )
}
