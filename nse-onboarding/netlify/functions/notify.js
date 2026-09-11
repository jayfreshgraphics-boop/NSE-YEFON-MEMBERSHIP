// Fires when a new member registers. Sends a Telegram message and an email
// to the Membership Officer so nothing has to be checked manually.
//
// Env vars required (set in Netlify: Site settings > Environment variables):
//   TELEGRAM_BOT_TOKEN   - from @BotFather
//   TELEGRAM_CHAT_ID     - your chat/group id (see README for how to find it)
//   RESEND_API_KEY       - from resend.com (free tier is plenty for this volume)
//   NOTIFY_EMAIL_TO      - where the email should land (e.g. your gmail)
//   NOTIFY_EMAIL_FROM    - a verified sender on your Resend account
//   VITE_SUPABASE_URL    - reused so the function can build a link to the admin view

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { member_id, full_name } = JSON.parse(event.body)
    const siteUrl = process.env.URL || ''
    const adminLink = `${siteUrl}/#admin`

    const results = await Promise.allSettled([
      sendTelegram(full_name, adminLink),
      sendEmail(full_name, adminLink),
    ])

    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length) {
      console.error('Notification failures:', failures.map((f) => f.reason))
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, member_id }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

async function sendTelegram(fullName, adminLink) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const text = `🆕 New member registration\n\n${fullName} just submitted their onboarding form.\n\nReview: ${adminLink}`

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) throw new Error(`Telegram error: ${await res.text()}`)
}

async function sendEmail(fullName, adminLink) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL_TO
  const from = process.env.NOTIFY_EMAIL_FROM
  if (!apiKey || !to || !from) return

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New member registration — ${fullName}`,
      html: `<p><strong>${fullName}</strong> just submitted their NSE Ikeja onboarding form.</p><p><a href="${adminLink}">Review in the admin dashboard</a></p>`,
    }),
  })
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)
}
