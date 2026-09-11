import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const steps = [
  { key: 'code_status', label: 'Confirmation code' },
  { key: 'cert_status', label: 'Certificate' },
  { key: 'social_status', label: 'Social media proof' },
  { key: 'payment_status', label: 'Payment' },
]

function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{status}</span>
}

export default function StatusPage({ memberId }) {
  const [member, setMember] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase.from('members').select('*').eq('id', memberId).single()
      if (!active) return
      if (error) setError('Could not find that registration.')
      else setMember(data)
    }
    load()
    const interval = setInterval(load, 15000)
    return () => { active = false; clearInterval(interval) }
  }, [memberId])

  if (error) return <div className="card"><p className="error">{error}</p></div>
  if (!member) return <div className="card"><p>Loading your status...</p></div>

  return (
    <div className="card">
      <h2>Hi {member.full_name.split(' ')[0]}, here's your onboarding status</h2>
      <ul className="status-list">
        {steps.map((s) => (
          <li key={s.key}>
            <span>{s.label}</span>
            <StatusPill status={member[s.key]} />
          </li>
        ))}
      </ul>
      {member.overall_status === 'approved' ? (
        <div className="success-box">
          <p>You're a confirmed member of NSE Ikeja Branch YEFON. 🎉</p>
          <p className="member-id">Member ID: {member.member_id}</p>
        </div>
      ) : (
        <p className="hint">This page updates automatically as each step is reviewed.</p>
      )}
    </div>
  )
}
