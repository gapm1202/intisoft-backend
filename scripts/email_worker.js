#!/usr/bin/env node
/**
 * Simple email worker that reads jobs/email_jobs.log (one JSON per line),
 * sends an email per job using SMTP (nodemailer), and moves processed jobs
 * to jobs/sent_emails.log. Logs to logs/email_worker.log and logs/email_worker.err
 *
 * Env vars required:
 *  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
 * Optional:
 *  - SMTP_SECURE (true/false string) - defaults to false
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const nodemailer = require('nodemailer');

const JOBS_FILE = path.resolve(process.cwd(), 'jobs', 'email_jobs.log');
const SENT_FILE = path.resolve(process.cwd(), 'jobs', 'sent_emails.log');
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const OUT_LOG = path.join(LOG_DIR, 'email_worker.log');
const ERR_LOG = path.join(LOG_DIR, 'email_worker.err');

function log(msg) { const line = `${new Date().toISOString()} ${msg}\n`; try { fs.mkdirSync(LOG_DIR, { recursive: true }); fs.appendFileSync(OUT_LOG, line); console.log(line.trim()); } catch(e) { console.error('log write failed', e); } }
function errlog(msg) { const line = `${new Date().toISOString()} ${msg}\n`; try { fs.mkdirSync(LOG_DIR, { recursive: true }); fs.appendFileSync(ERR_LOG, line); console.error(line.trim()); } catch(e) { console.error('errlog write failed', e); } }

async function main(){
  // Validate SMTP env
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const FROM_EMAIL = process.env.FROM_EMAIL;
  const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
    errlog('Missing SMTP env vars. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL');
    process.exit(2);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT,10),
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  log('Email worker started');

  // Read jobs file
  if (!fs.existsSync(JOBS_FILE)) {
    log(`Jobs file not found: ${JOBS_FILE} — nothing to process`);
    process.exit(0);
  }

  let lines = fs.readFileSync(JOBS_FILE, 'utf8').split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) {
    log('No jobs to process');
    process.exit(0);
  }

  const processed = [];
  for (const raw of lines) {
    let job;
    try { job = JSON.parse(raw); } catch (e) { errlog('Invalid job JSON, skipping: ' + raw); continue; }

    const ticketId = job.ticketId || '(no-ticket)';
    const to = job.reporterEmail;
    const reporterName = job.reporterName || '';
    const assetId = job.assetId || '';
    const description = job.description || '';

    if (!to) { errlog(`Job ${ticketId} missing reporterEmail, skipping`); continue; }

    const subject = `[Informe] Reporte recibido — ${ticketId}`;
    const body = `Hola ${reporterName || ''},\n\nHemos recibido tu reporte para el activo ${assetId}.\n\nTicket: ${ticketId}\n\nDescripción:\n${description}\n\nGracias.\n`;

    try {
      log(`Sending email ticket=${ticketId} to=${to}`);
      const info = await transporter.sendMail({ from: FROM_EMAIL, to, subject, text: body });
      log(`Sent ticket=${ticketId} messageId=${info.messageId}`);
      // record in sent file
      try { fs.mkdirSync(path.dirname(SENT_FILE), { recursive: true }); fs.appendFileSync(SENT_FILE, raw + os.EOL); } catch(e) { errlog('Failed to append sent file: ' + e.message); }
      processed.push(raw);
    } catch (e) {
      errlog(`Failed to send email for ticket=${ticketId}: ${e && e.message ? e.message : e}`);
      // keep job for retry
    }
  }

  // Remove processed lines from jobs file
  if (processed.length > 0) {
    try {
      const remaining = lines.filter(l => !processed.includes(l));
      fs.writeFileSync(JOBS_FILE, remaining.join(os.EOL) + (remaining.length ? os.EOL : ''));
      log(`Processed ${processed.length} jobs, ${remaining.length} remaining`);
    } catch (e) {
      errlog('Failed to rewrite jobs file: ' + e.message);
    }
  } else {
    log('No jobs were processed (all failed or none eligible)');
  }

  log('Worker finished');
}

main().catch(e => { errlog('Worker crashed: ' + (e && e.stack ? e.stack : e)); process.exit(1); });
