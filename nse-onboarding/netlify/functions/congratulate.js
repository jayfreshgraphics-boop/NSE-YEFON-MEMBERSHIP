// Fires when a member's 4th and final step gets approved, flipping their
// overall_status to 'approved'. Sends them a congratulatory welcome email.
//
// Reuses the same env vars as notify.js:
//   RESEND_API_KEY, NOTIFY_EMAIL_FROM

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { email, full_name, member_id } = JSON.parse(event.body)
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.NOTIFY_EMAIL_FROM

    if (!apiKey || !from || !email) {
      return { statusCode: 200, body: JSON.stringify({ skipped: true }) }
    }

    const firstName = (full_name || '').split(' ')[0]

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Welcome to NSE Ikeja Branch! 🎉',
        html: `
          <div style="font-family: sans-serif; color: #14231C;">
            <h2 style="color: #157A3E;">Congratulations, ${firstName}!</h2>
            <p>Your membership onboarding with <strong>NSE Ikeja Branch YEFON</strong> is now fully approved.</p>
            <p>Your Member ID: <strong>${member_id}</strong></p>
            <p>Welcome aboard — we look forward to having you active in branch activities.</p>
            <p style="margin-top: 24px; color: #3F5548;">NSE Ikeja Branch — The Branch to Beat</p>
          </div>
        `,
      }),
    })

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
