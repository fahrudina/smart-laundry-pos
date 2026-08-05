# GTM campaign sender

One-time go-to-market send to every active registered account in
`public.users` (laundry owners/staff who signed up for the app) — email
first, then a WhatsApp follow-up, throttled to **1 WhatsApp message per 15
minutes** to stay well under WhatsApp's spam/block heuristics for bulk sends.

This does **not** touch `public.customers` (a store's own laundry
customers) — see the audience note in the script header if you also want to
run this against that list.

## Before you run this for real

1. **Read and edit `message-copy.mjs`.** It's a first draft — approve or
   rewrite the subject/body/WhatsApp text before any `--live` run.
2. **Set the required env vars** (in your shell or a local `.env` — never
   commit real values):

   | Var | Purpose | Where to get it |
   |---|---|---|
   | `SUPABASE_URL` | Same project URL as `src/integrations/supabase/client.ts` | Supabase dashboard → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS to read *all* users across stores | Supabase dashboard → Project Settings → API (⚠️ secret, never expose client-side) |
   | `RESEND_API_KEY` | Sends the email | resend.com dashboard, after verifying a sending domain |
   | `GTM_EMAIL_FROM` | Verified "from" address, e.g. `Smart Laundry POS <hello@yourdomain.com>` | Must match the domain verified in Resend |
   | `WHATSAPP_API_URL`, `WHATSAPP_USERNAME`, `WHATSAPP_PASSWORD` | Same WhatsApp provider already used in production | Same values as the Vercel project's env vars (see `api/whatsapp-send.js`) |

   Any of the email or WhatsApp vars can be left unset — that phase's sends
   are reported as `skipped-no-provider` per recipient instead of failing,
   so you can e.g. wire up email now and WhatsApp later.

## Usage

```bash
# Preview only — no network calls, no state written. Always start here.
node scripts/gtm-campaign/send-campaign.mjs

# Preview against just the first 3 users
node scripts/gtm-campaign/send-campaign.mjs --limit=3

# Smoke test against exactly one real recipient before going wide
node scripts/gtm-campaign/send-campaign.mjs --live --limit=1

# Full live run (asks for typed confirmation first)
node scripts/gtm-campaign/send-campaign.mjs --live

# Run just one phase (e.g. email already went out, WhatsApp got interrupted)
node scripts/gtm-campaign/send-campaign.mjs --live --only=whatsapp
```

## How it behaves

- **Dry run is the default.** Nothing is sent unless you pass `--live`.
- **`--live` requires typed confirmation** (`SEND <n>`) showing the exact
  recipient count before anything goes out.
- **Resumable.** Every send result is written to `state.json` immediately
  after it happens. If the process dies or you Ctrl+C mid-run (this is
  expected for the WhatsApp phase — 1 msg/15min means a full run for N
  recipients takes roughly `(N-1) × 15` minutes), just re-run the same
  `--live` command: anyone already marked `sent` is skipped.
- **`state.json` contains real recipient emails/phones and is gitignored.**
  Don't paste it anywhere public.
- Because the WhatsApp phase can run for hours, run it under `nohup`,
  `tmux`, or `screen` rather than in a terminal you might close:

  ```bash
  nohup node scripts/gtm-campaign/send-campaign.mjs --live > gtm-run.log 2>&1 &
  ```

## Also available as an npm script

```bash
npm run gtm:campaign            # dry run
npm run gtm:campaign -- --live  # live run
```
