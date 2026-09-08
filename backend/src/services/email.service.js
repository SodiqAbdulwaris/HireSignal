const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const config = require('../config/env');

let transporter = null;
let resendClient = null;

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
        return { success: false, error };
      }
      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error('❌ Resend email send exception:', err);
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
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('❌ SMTP Email send failure:', err);
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

  return { success: true, messageId: 'console-log', delivery: 'console' };
}

module.exports = {
  sendEmail,
};
