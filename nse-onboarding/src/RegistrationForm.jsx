import { useState } from 'react'
import { supabase } from './supabaseClient'

const initialForm = { full_name: '', email: '', phone: '', confirmation_code: '' }

async function uploadFile(file, memberId, label) {
  if (!file) return null
  const path = `${memberId}/${label}-${file.name}`
  const { error } = await supabase.storage.from('member-uploads').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('member-uploads').getPublicUrl(path)
  return data.publicUrl
}

export default function RegistrationForm({ onSubmitted }) {
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState({ certificate: null, social: null, receipt: null })
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateFile(field, file) {
    setFiles((f) => ({ ...f, [field]: file }))
  }

  function validateStep() {
    if (step === 1) return form.full_name && form.email && form.phone && form.confirmation_code
    if (step === 2) return !!files.certificate
    if (step === 3) return !!files.social
    if (step === 4) return !!files.receipt
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('members')
        .insert({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          confirmation_code: form.confirmation_code,
        })
        .select()
        .single()
      if (insertErr) throw insertErr

      const [certUrl, socialUrl, receiptUrl] = await Promise.all([
        uploadFile(files.certificate, inserted.id, 'certificate'),
        uploadFile(files.social, inserted.id, 'social'),
        uploadFile(files.receipt, inserted.id, 'receipt'),
      ])

      const { error: updateErr } = await supabase
        .from('members')
        .update({
          certificate_url: certUrl,
          social_proof_url: socialUrl,
          receipt_url: receiptUrl,
        })
        .eq('id', inserted.id)
      if (updateErr) throw updateErr

      await fetch('/.netlify/functions/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: inserted.id, full_name: form.full_name }),
      }).catch(() => {}) // notification failure shouldn't block registration

      onSubmitted(inserted.id)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const stepLabels = ['Your details', 'Certificate', 'Social proof', 'Payment receipt']

  return (
    <div className="card">
      <div className="progress">
        {stepLabels.map((label, i) => (
          <div key={label} className={`progress-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <span className="progress-dot">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="progress-label">{label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); if (validateStep()) setStep(step + 1) }}>
        {step === 1 && (
          <fieldset>
            <label>Full name
              <input required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="As on your certificate" />
            </label>
            <label>Email
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </label>
            <label>Phone
              <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0803..." />
            </label>
            <label>Confirmation code
              <input required value={form.confirmation_code} onChange={(e) => update('confirmation_code', e.target.value)} placeholder="Given at the MGM/event" />
              <span className="hint">Get this from the Membership Officer at the event you attended.</span>
            </label>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <label>Upload your certificate
              <input required type="file" accept="image/*,.pdf" onChange={(e) => updateFile('certificate', e.target.files[0])} />
              <span className="hint">A clear photo or scan of your NSE Membership certificate.</span>
            </label>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <p className="fieldset-intro">
              Follow NSE Ikeja Branch on <a href="https://www.linkedin.com/company/the-nigerian-society-of-engineers-ikeja-branch" target="_blank" rel="noreferrer">LinkedIn</a> and <a href="https://youtube.com/channel/UCiDPDJsVZRE2e8y84ESmsOg" target="_blank" rel="noreferrer">YouTube</a>, then upload proof.
            </p>
            <label>Upload screenshot proof
              <input required type="file" accept="image/*" onChange={(e) => updateFile('social', e.target.files[0])} />
              <span className="hint">Merge both in a pdf and upload.</span>
            </label>
          </fieldset>
        )}

        {step === 4 && (
          <fieldset>
            <p className="fieldset-intro">
              Pay ₦2,500 Graduate Member due to First Bank, account <strong>2009996717</strong>, Ikeja Branch. Use the caption <strong>"YEFON DUE"</strong>.
            </p>
            <label>Upload payment receipt
              <input required type="file" accept="image/*,.pdf" onChange={(e) => updateFile('receipt', e.target.files[0])} />
            </label>
          </fieldset>
        )}

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          {step > 1 && <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>Back</button>}
          <button type="submit" className="btn-primary" disabled={submitting || !validateStep()}>
            {step < 4 ? 'Continue' : submitting ? 'Submitting...' : 'Submit registration'}
          </button>
        </div>
      </form>
    </div>
  )
}
