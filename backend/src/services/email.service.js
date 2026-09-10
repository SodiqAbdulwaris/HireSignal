const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const config = require('../config/env');

// No provider configured (local dev) means emails only ever hit the
// console, which scrolls away. Mirror them to a gitignored file so a
// verification/reset link is still findable after the fact.
const OUTBOX_LOG_PATH = path.resolve(__dirname, '../../logs/email-outbox.log');

function appendToOutboxLog(entry) {
  fs.mkdirSync(path.dirname(OUTBOX_LOG_PATH), { recursive: true });
  fs.appendFileSync(OUTBOX_LOG_PATH, JSON.stringify(entry) + '\n');
}

let transporter = null;
let resendClient = null;

// No metrics/alerting stack exists in this codebase yet — this in-process
// counter is a minimal, dependency-free way to make repeated delivery
// failures visible to log-based alerting, rather than each failure logging
// identically to a one-off blip. Resets to zero on any successful send.
const REPEATED_FAILURE_THRESHOLD = 3;
let consecutiveFailures = 0;

function recordDeliveryOutcome(succeeded, provider) {
  if (succeeded) {
    consecutiveFailures = 0;
    return;
  }
  consecutiveFailures += 1;
  if (consecutiveFailures >= REPEATED_FAILURE_THRESHOLD) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'email_delivery_repeated_failure',
        provider,
        consecutiveFailures,
        message: `${consecutiveFailures} consecutive email delivery failures via ${provider}`,
      })
    );
  }
}

// Initialize clients based on available configurations (Resend takes priority in production)
if (config.resendApiKey) {
  console.log('📧 Email Service: Resend Configured.');
  resendClient = new Resend(config.resendApiKey);
} else if (config.smtpUser && config.smtpPass) {
  console.log('📧 Email Service: SMTP Configured.');
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true for 465, false for 587
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass.replace(/\s+/g, ''),
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
  });
} else {
  console.log('📧 Email Service: No email backend configured. Falling back to Console logging.');
}

/**
 * Send an email using SMTP (Nodemailer), Resend, or fallback to Console Logging.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} [options.replyTo] - Reply-to email address (useful for contact forms)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: any }>}
 */
async function sendEmail({ to, subject, text, html, replyTo }) {
  const from = config.emailFrom;

  // 1. Resend API (preferred method)
  if (resendClient) {
    try {
      const { data, error } = await resendClient.emails.send({
        from,
        to,
        reply_to: replyTo,
        subject,
        text,
        html,
      });

      if (error) {
        console.error('❌ Resend API email send failure:', error);
        recordDeliveryOutcome(false, 'resend');
        return { success: false, error };
      }
      recordDeliveryOutcome(true, 'resend');
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error('❌ Resend email send exception:', err);
      recordDeliveryOutcome(false, 'resend');
      throw err;
    }
  }

  // 2. SMTP Transporter (Nodemailer fallback)
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
        replyTo,
      });
      recordDeliveryOutcome(true, 'smtp');
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('❌ SMTP Email send failure:', err);
      recordDeliveryOutcome(false, 'smtp');
      throw err;
    }
  }

  // 3. Fallback to Console Log
  console.log('\n==================================================');
  console.log('⚠️  EMAIL SENT TO CONSOLE (No SMTP or Resend Configured)');
  console.log(`To: ${to}`);
  console.log(`From: ${from}`);
  if (replyTo) console.log(`Reply-To: ${replyTo}`);
  console.log(`Subject: ${subject}`);
  console.log('------------------ TEXT CONTENT ------------------');
  console.log(text);
  console.log('==================================================\n');

  appendToOutboxLog({ timestamp: new Date().toISOString(), to, from, replyTo, subject, text });

  return { success: true, messageId: 'console-log', delivery: 'console' };
}

module.exports = {
  sendEmail,
  // Exported for direct unit testing of the failure-counting logic —
  // the actual provider branches are hard to exercise without a live
  // (or heavily mocked) SMTP/Resend client.
  recordDeliveryOutcome,
};
