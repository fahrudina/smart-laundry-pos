#!/usr/bin/env node
/**
 * GTM campaign sender.
 *
 * Emails every active registered account in `public.users` first, then
 * WhatsApp-messages them at a strict 1-message-per-15-minutes cadence to
 * stay well under WhatsApp's spam/block heuristics for bulk sends.
 *
 * SAFE BY DEFAULT: with no flags, this only PREVIEWS what would happen —
 * recipient count + a rendered sample message — and sends nothing. Pass
 * --live to actually dispatch, which requires a typed confirmation.
 *
 * RESUMABLE: every send result is persisted to state.json immediately, so
 * killing the process (Ctrl+C, machine restart) and re-running with --live
 * picks up exactly where it left off instead of re-messaging anyone.
 *
 * Usage:
 *   node scripts/gtm-campaign/send-campaign.mjs                    # dry run, all users
 *   node scripts/gtm-campaign/send-campaign.mjs --limit=3          # dry run, first 3 only
 *   node scripts/gtm-campaign/send-campaign.mjs --live --limit=1   # smoke test on 1 real user
 *   node scripts/gtm-campaign/send-campaign.mjs --live             # full live run
 *   node scripts/gtm-campaign/send-campaign.mjs --live --only=email
 *   node scripts/gtm-campaign/send-campaign.mjs --live --only=whatsapp
 *
 * See README.md in this directory for required environment variables.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import readline from 'node:readline/promises';
import { emailSubject, emailHtml, emailText, whatsappMessage } from './message-copy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, 'state.json');
const WHATSAPP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes — do not lower without checking with the WA provider

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : fallback;
};

const LIVE = flag('live');
const ONLY = opt('only', 'all'); // 'all' | 'email' | 'whatsapp'
const LIMIT = opt('limit', null);

if (!['all', 'email', 'whatsapp'].includes(ONLY)) {
  console.error(`Invalid --only=${ONLY}. Expected all | email | whatsapp.`);
  process.exit(1);
}

function loadState() {
  if (!existsSync(STATE_PATH)) return {};
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function personalize(template, user) {
  return template
    .replace(/\{\{name\}\}/g, user.full_name || 'Bapak/Ibu')
    .replace(/\{\{email\}\}/g, user.email || '');
}

// Mirrors WhatsAppClient.formatPhoneNumber (src/integrations/whatsapp/client.ts)
// so numbers land in the same "62..." shape the provider expects.
function formatPhone(phone, defaultCountryCode = '62') {
  const cleaned = String(phone || '').replace(/\D/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith(defaultCountryCode)) return cleaned;
  if (cleaned.startsWith('0')) return `${defaultCountryCode}${cleaned.slice(1)}`;
  return `${defaultCountryCode}${cleaned}`;
}

async function fetchUsers(supabase) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, phone, full_name, is_active')
    .eq('is_active', true)
    .not('email', 'is', null);
  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return LIMIT ? data.slice(0, Number(LIMIT)) : data;
}

async function sendEmail(user) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.GTM_EMAIL_FROM;
  if (!apiKey || !from) return { status: 'skipped-no-provider' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: user.email,
      subject: emailSubject,
      html: personalize(emailHtml, user),
      text: personalize(emailText, user),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend HTTP ${res.status}: ${await res.text()}`);
  }
  return { status: 'sent' };
}

// Same endpoint/auth shape as api/whatsapp-send.js, called directly since this
// script already runs server-side — no need to hop through the Vercel proxy.
async function sendWhatsApp(user) {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const username = process.env.WHATSAPP_USERNAME || 'admin';
  const password = process.env.WHATSAPP_PASSWORD;
  const phone = formatPhone(user.phone);

  if (!phone) return { status: 'skipped-no-phone' };
  if (!apiUrl || !password) return { status: 'skipped-no-provider' };

  const endpoint = apiUrl.endsWith('/api/send-message') ? apiUrl : `${apiUrl}/api/send-message`;
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({ to: phone, message: personalize(whatsappMessage, user) }),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp API HTTP ${res.status}: ${await res.text()}`);
  }
  return { status: 'sent' };
}

function printDryRunPreview(users) {
  const sample = users[0];
  console.log(`\n=== DRY RUN — nothing will be sent ===`);
  console.log(`Recipients: ${users.length} active registered account(s)${LIMIT ? ` (--limit=${LIMIT})` : ''}`);
  console.log(`Phase(s) to run: ${ONLY}`);
  if (ONLY !== 'email') {
    const hours = ((users.length - 1) * WHATSAPP_INTERVAL_MS) / 3_600_000;
    console.log(`Estimated WhatsApp phase duration: ~${hours.toFixed(1)}h for ${users.length} recipients at 1 msg/15min`);
  }
  if (sample) {
    console.log(`\n--- Sample email (to ${sample.email}) ---`);
    console.log(`Subject: ${emailSubject}`);
    console.log(personalize(emailText, sample));
    console.log(`\n--- Sample WhatsApp message (to ${formatPhone(sample.phone)}) ---`);
    console.log(personalize(whatsappMessage, sample));
  }
  console.log(`\nEnv check: RESEND_API_KEY=${process.env.RESEND_API_KEY ? 'set' : 'MISSING'}, GTM_EMAIL_FROM=${process.env.GTM_EMAIL_FROM ? 'set' : 'MISSING'}, WHATSAPP_API_URL=${process.env.WHATSAPP_API_URL ? 'set' : 'MISSING'}, WHATSAPP_PASSWORD=${process.env.WHATSAPP_PASSWORD ? 'set' : 'MISSING'}`);
  console.log(`\nRun with --live once you've reviewed message-copy.mjs and the env vars above are in place.`);
}

async function confirmLiveRun(users) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\n⚠️  LIVE RUN: about to message ${users.length} real registered account(s), phase(s): ${ONLY}.`);
  if (users[0]) console.log(`   Sample recipient: ${users[0].email} / ${users[0].phone}`);
  const answer = await rl.question(`   Type "SEND ${users.length}" to confirm, anything else to abort: `);
  rl.close();
  return answer.trim() === `SEND ${users.length}`;
}

async function runEmailPhase(users, state) {
  console.log(`\n📧 Email phase (LIVE)`);
  for (const user of users) {
    state[user.id] ??= {};
    if (state[user.id].email?.status === 'sent') {
      console.log(`  - ${user.email}: already sent, skipping`);
      continue;
    }
    try {
      const result = await sendEmail(user);
      state[user.id].email = { ...result, at: new Date().toISOString() };
      console.log(`  - ${user.email}: ${result.status}`);
    } catch (err) {
      state[user.id].email = { status: 'error', error: err.message, at: new Date().toISOString() };
      console.error(`  - ${user.email}: ERROR ${err.message}`);
    }
    saveState(state);
  }
}

async function runWhatsAppPhase(users, state) {
  console.log(`\n💬 WhatsApp phase (LIVE) — 1 message / 15 min`);
  for (const [i, user] of users.entries()) {
    state[user.id] ??= {};
    if (state[user.id].whatsapp?.status === 'sent') {
      console.log(`  - ${user.phone}: already sent, skipping`);
      continue;
    }

    let status = 'error';
    try {
      const result = await sendWhatsApp(user);
      status = result.status;
      state[user.id].whatsapp = { ...result, at: new Date().toISOString() };
      console.log(`  - ${user.phone}: ${result.status}`);
    } catch (err) {
      state[user.id].whatsapp = { status: 'error', error: err.message, at: new Date().toISOString() };
      console.error(`  - ${user.phone}: ERROR ${err.message}`);
    }
    saveState(state);

    // Only throttle after an actual send — skip/dry-run/error results don't
    // count against WhatsApp's rate, so no need to burn 15 minutes on them.
    const isLast = i === users.length - 1;
    if (!isLast && status === 'sent') {
      console.log(`  … waiting 15 minutes before the next WhatsApp send`);
      await sleep(WHATSAPP_INTERVAL_MS);
    }
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars. See README.md.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const users = await fetchUsers(supabase);

  if (users.length === 0) {
    console.log('No active registered accounts found. Nothing to do.');
    return;
  }

  if (!LIVE) {
    printDryRunPreview(users);
    return;
  }

  if (!(await confirmLiveRun(users))) {
    console.log('Aborted: confirmation did not match.');
    process.exit(1);
  }

  const state = loadState();
  if (ONLY === 'all' || ONLY === 'email') await runEmailPhase(users, state);
  if (ONLY === 'all' || ONLY === 'whatsapp') await runWhatsAppPhase(users, state);

  console.log('\nDone. See state.json for a full per-recipient log.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
