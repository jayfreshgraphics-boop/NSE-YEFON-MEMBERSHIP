# NSE Ikeja Branch — Graduate Member Onboarding Portal

Members register and upload their 4 steps themselves. You approve each step
from an admin dashboard. You get pinged on Telegram + email the moment
someone registers. A live status page lets members check their own progress
instead of DMing you.

## What's in here
- `src/RegistrationForm.jsx` — the public 4-step form
- `src/StatusPage.jsx` — member-facing status tracker (`/#status/<id>`)
- `src/AdminDashboard.jsx` — your approval dashboard (`/#admin`)
- `schema.sql` — database setup for Supabase
- `netlify/functions/notify.js` — sends Telegram + email on new registration

## Setup (about 20 minutes)

### 1. Create a Supabase project
- Go to supabase.com → New project (you said you want a new one, separate from the Welfare Tracker)
- Once it's ready, open **SQL Editor** → paste the contents of `schema.sql` → Run
- Go to **Project Settings > API** — copy the **Project URL** and **anon public key**

### 2. Get your Telegram chat ID
Since you already have a bot:
- Message your bot once (anything) so it has a chat to reply to
- Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in a browser
- Find `"chat":{"id": ...}` in the response — that number is your `TELEGRAM_CHAT_ID`

### 3. Set up email (Resend — free tier)
- Sign up at resend.com
- Add and verify a sending domain or use their test sender for now
- Copy your API key

### 4. Push this to GitHub, then deploy on Netlify
- Create a new repo, push this folder
- On Netlify: **Add new site > Import from Git** → select the repo
- Build command: `npm run build`, publish directory: `dist` (already set in `netlify.toml`)

### 5. Set environment variables in Netlify
Site settings > Environment variables — add:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | from step 1 |
| `VITE_SUPABASE_ANON_KEY` | from step 1 |
| `VITE_ADMIN_PASSCODE` | any passcode you'll use to open `/#admin` |
| `TELEGRAM_BOT_TOKEN` | your bot's token |
| `TELEGRAM_CHAT_ID` | from step 2 |
| `RESEND_API_KEY` | from step 3 |
| `NOTIFY_EMAIL_TO` | your email |
| `NOTIFY_EMAIL_FROM` | a verified sender from step 3 |

Redeploy after adding these (Netlify > Deploys > Trigger deploy).

## Using it

- **Share the site's root URL** with new graduate members — that's the registration form
- **You go to `<your-site>/#admin`**, enter your passcode, and approve/reject each
  of the 4 steps per member with one click
- Once all 4 are approved, the system auto-generates a Member ID and marks them fully approved
- Each member gets a link back to `/#status/<their-id>` after submitting, so they
  can check progress without messaging you

## Local development
```
npm install
cp .env.example .env   # fill in the Supabase values
npm run dev
```
Note: the Netlify Function (notifications) only runs when deployed on Netlify,
or locally via `netlify dev` if you have the Netlify CLI installed.

## About the Google Sheet sync
Supabase doesn't push to Sheets natively. The simplest route: use a free
Zapier or Make.com "New row in Supabase → New row in Google Sheets" automation
pointed at the `members` table — takes about 5 minutes to set up and needs no
code. Happy to build a native version later if you outgrow the free tier.
