import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from './supabaseClient'

const STEP_FIELDS = [
  { status: 'code_status', file: null, label: 'Code' },
  { status: 'cert_status', file: 'certificate_url', label: 'Certificate' },
  { status: 'social_status', file: 'social_proof_url', label: 'Social' },
  { status: 'payment_status', file: 'receipt_url', label: 'Payment' },
]

const PASSCODE_KEY = 'nse_admin_ok'

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem(PASSCODE_KEY) === '1')
  const [passcode, setPasscode] = useState('')
  const [members, setMembers] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (unlocked) load()
  }, [unlocked])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  function checkPasscode(e) {
    e.preventDefault()
    // Set VITE_ADMIN_PASSCODE in your Netlify env vars — this is a light gate, not real auth.
    if (passcode === import.meta.env.VITE_ADMIN_PASSCODE) {
      sessionStorage.setItem(PASSCODE_KEY, '1')
      setUnlocked(true)
    } else {
      alert('Incorrect passcode')
    }
  }

  async function setStatus(id, field, value) {
    await supabase.from('members').update({ [field]: value }).eq('id', id)
    load()
  }

  function exportApproved() {
    const approved = members.filter((m) => m.overall_status === 'approved')
    const rows = approved.map((m) => ({
      'Member ID': m.member_id,
      'Full Name': m.full_name,
      'Email': m.email,
      'Phone': m.phone,
      'Confirmation Code': m.confirmation_code,
      'Registered': new Date(m.created_at).toLocaleDateString(),
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Approved Members')
    XLSX.writeFile(book, `NSE-Ikeja-Approved-Members-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (!unlocked) {
    return (
      <div className="card" style={{ maxWidth: 360 }}>
        <h2>Admin access</h2>
        <form onSubmit={checkPasscode}>
          <label>Passcode
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} autoFocus />
          </label>
          <button type="submit" className="btn-primary" style={{ marginTop: 12 }}>Enter</button>
        </form>
      </div>
    )
  }

  const filtered = members.filter((m) => filter === 'all' || m.overall_status === filter)

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Registrations</h2>
        <div className="filter-row">
          {['all', 'pending', 'approved'].map((f) => (
            <button key={f} className={`chip ${filter === f ? 'chip-active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
          <button className="chip" onClick={load}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          <button className="chip chip-export" onClick={exportApproved}>Export approved (.xlsx)</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              {STEP_FIELDS.map((s) => <th key={s.status}>{s.label}</th>)}
              <th>Overall</th>
              <th>Member ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>{m.full_name}</td>
                <td className="contact-cell">{m.email}<br /><span className="muted">{m.phone}</span></td>
                {STEP_FIELDS.map((s) => (
                  <td key={s.status}>
                    {s.file && m[s.file] && (
                      <a href={m[s.file]} target="_blank" rel="noreferrer" className="view-link">View</a>
                    )}
                    {s.status === 'code_status' && <div className="muted">{m.confirmation_code}</div>}
                    <div className="approve-row">
                      <button className={`mini-btn ${m[s.status] === 'approved' ? 'mini-btn-on' : ''}`} onClick={() => setStatus(m.id, s.status, 'approved')}>✓</button>
                      <button className={`mini-btn mini-btn-reject ${m[s.status] === 'rejected' ? 'mini-btn-on' : ''}`} onClick={() => setStatus(m.id, s.status, 'rejected')}>✕</button>
                    </div>
                  </td>
                ))}
                <td><span className={`pill pill-${m.overall_status}`}>{m.overall_status}</span></td>
                <td className="muted">{m.member_id || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && <p className="hint" style={{ padding: 16 }}>No registrations here yet.</p>}
      </div>
    </div>
  )
}
