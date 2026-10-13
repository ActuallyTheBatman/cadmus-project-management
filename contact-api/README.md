# cadmus-contact-api

The serverless function backing the lead-capture form on cadmusprojects.com's `/contact/` page.

GitHub Pages (the main site in this repo) is static-only, so this lives as a **separate Vercel project** - it is not deployed by GitHub Pages. This folder exists for version control and documentation; the live function is deployed directly to Vercel from this source.

- **Live endpoint:** `https://cadmus-contact-api.vercel.app/api/contact`
- **Vercel project:** `cadmus-contact-api`, under the `garrett@cadmusprojects.com` Vercel account
- **What it does:** accepts a `POST` with `{ name, email, organization, message, _gotcha }`, drops anything that fills the `_gotcha` honeypot field (spam), and emails valid submissions to `Garrett@cadmusprojects.com` via Gmail SMTP, with `replyTo` set to the submitter's email so you can just hit reply.

## Required setup (one-time)

This function will return `{"ok":false,"error":"Mail transport not configured"}` until two environment variables are set on the `cadmus-contact-api` Vercel project:

1. In your Google Account, go to **Security → 2-Step Verification → App Passwords** and generate an app password for "Mail" (requires 2-Step Verification to be turned on first).
2. In the Vercel dashboard, open the `cadmus-contact-api` project → **Settings → Environment Variables**, and add:
   - `GMAIL_USER` = `Garrett@cadmusprojects.com`
   - `GMAIL_APP_PASSWORD` = the app password from step 1
3. Redeploy the project (or trigger a new deployment) so the env vars take effect.

Set these directly in the Vercel dashboard rather than pasting the app password anywhere else - it's a live credential.

## Redeploying after a code change

From this folder:

```bash
vercel --prod
```

or push changes and redeploy via the Vercel dashboard / MCP tooling.
