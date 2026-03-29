# Clock In / Clock Out — Setup Guide (Google Sheets)

## 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it: `Isabella Attendance`
3. The app will **automatically create** an `Attendance` tab with correct headers on first use — you don't need to add columns manually
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**<SHEET_ID>**/edit`

---

## 2. Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one), e.g. `Isabella Ops`
3. Enable the **Google Sheets API**:
   - APIs & Services → Enable APIs → search "Google Sheets API" → Enable
4. Create a Service Account:
   - APIs & Services → Credentials → Create Credentials → Service Account
   - Name: `isabella-attendance`
   - No special roles needed — click Done
5. Open the service account → Keys tab → Add Key → JSON
6. Download the JSON file — you'll need two values from it:
   - `client_email` → this is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key`  → this is your `GOOGLE_PRIVATE_KEY`

---

## 3. Share the Sheet with the Service Account

1. Open your Google Sheet
2. Click **Share** (top right)
3. Paste the service account email (e.g. `isabella-attendance@your-project.iam.gserviceaccount.com`)
4. Set permission to **Editor**
5. Click Send (ignore the "can't notify" warning — that's fine)

---

## 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=isabella-attendance@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

> **Tip for GOOGLE_PRIVATE_KEY:** Open the downloaded JSON, copy the `private_key` value (the whole string including `-----BEGIN...-----END...`). The `\n` characters should stay as `\n` — don't replace them with real newlines.

---

## 5. Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — on first clock-in the app auto-creates the `Attendance` sheet with all headers.

---

## 6. Deploy to Vercel (bookmarkable link for the team)

```bash
npx vercel
```

Add the three env variables in Vercel dashboard:
- Project → Settings → Environment Variables
- Add `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`

Share the Vercel URL with the team — they bookmark it, done.

---

## Sheet Layout (auto-created)

| record_id | name | date | shift | clock_in | clock_out | hours_worked | status |
|-----------|------|------|-------|----------|-----------|--------------|--------|
| uuid | Ana | 2026-03-25 | Morning | 2026-03-25T09:00:00Z | 2026-03-25T17:00:00Z | 8 | Clocked Out |

---

## Pages

| URL          | Who uses it      | What it does                          |
|--------------|------------------|---------------------------------------|
| `/`          | All team members | Clock in / Clock out                  |
| `/dashboard` | Managers / Mario | Live view of who's clocked in now     |
