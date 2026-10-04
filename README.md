# Vercel MCQ Quiz Starter with Google Sheets Integration

A single-quiz Next.js + TypeScript MCQ application designed for Vercel with Google Sheets submission via Google Apps Script.

## Architecture

```
Student Quiz (Frontend)
       ↓  POST /api/submit
Next.js API Route (Backend)
       ↓  POST fetch()
Google Apps Script Web App
       ↓  SpreadsheetApp
Google Sheet ("Results")
```

## Features

- **Direct Google Sheets Integration**: Uses Google Apps Script Web App — no service accounts, OAuth keys, or `googleapis` packages required.
- **Duplicate Submission Guard**: Attempt ID uniqueness is enforced via Google Apps Script's `LockService` and frontend locks.
- **Automatic & Manual Submission**: Supports submission on button click (`manual`) or on countdown expiry (`auto`).
- **Complete Refresh Persistence**: Entire quiz state survives page reloads (Attempt ID, name, register number, questions, answers, timer, tab switch count, and submission state).
- **Security-First**: The Google Apps Script Web App URL is kept strictly in server-side environment variables (`GOOGLE_APPS_SCRIPT_URL`) and never exposed to the browser.
- **Double-Click Protection**: Submit button disables itself immediately and displays "Submitting...".
- **Tab Switch Detection**: Automatically tracks window blurs/switches and logs counts.

---

## 1. Setup Google Sheet & Google Apps Script

1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. Rename the active sheet tab to **`Results`**.
3. In row 1, set the following 14 columns:
   ```text
   Attempt ID | Student Name | Register Number | Date/Time | Total Questions | Attempted | Skipped | Correct | Wrong | Score | Percentage | Time Taken | Tab Switches | Submission Type
   ```
4. Click **Extensions** > **Apps Script**.
5. Replace any existing code in `Code.gs` with the contents of the included [`Code.gs`](./Code.gs).
6. Click **Deploy** > **New deployment**.
7. Click the gear icon next to "Select type" and select **Web app**.
8. Set the configuration:
   - **Description**: Quiz Submission Web App
   - **Execute as**: **Me** (`your-email@gmail.com`)
   - **Who has access**: **Anyone**
9. Click **Deploy**, review permissions, and grant access.
10. Copy the generated **Web app URL** (e.g. `https://script.google.com/macros/s/.../exec`).

---

## 2. Environment Variables

Create a `.env.local` file in the project root:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

## 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 4. Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. In your Vercel Dashboard, import the repository.
3. Under **Project Settings** > **Environment Variables**, add:
   - **Key**: `GOOGLE_APPS_SCRIPT_URL`
   - **Value**: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
4. Click **Deploy**.
