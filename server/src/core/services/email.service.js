import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

// Safe HTML entity escaping to prevent HTML injection in emails
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseSender(fromStr = 'Projectify <haritgevariya007@gmail.com>') {
  const match = fromStr.match(/^(?:(?:"?([^"]*)"?\s*)?<([^>]+)>|([^<>\s]+))$/);
  if (match) {
    const name = match[1] || 'Projectify';
    const email = match[2] || match[3] || 'haritgevariya007@gmail.com';
    return { name, email };
  }
  return { name: 'Projectify', email: fromStr };
}

let smtpTransporter = null;
function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'haritgevariya007@gmail.com';
  const pass = (process.env.SMTP_PASS || 'pxsf bgts ofdd dkbj').trim();

  if (user && pass) {
    smtpTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }
  return smtpTransporter;
}

/**
 * Determine the active email dispatch provider.
 * Priority:
 * 1. env.email.provider ('brevo', 'resend', 'smtp')
 * 2. Auto-detect: BREVO_API_KEY -> 'brevo', RESEND_API_KEY -> 'resend', SMTP_PASS -> 'smtp'
 */
export function getActiveEmailProvider() {
  if (process.env.EMAIL_PROVIDER) {
    return process.env.EMAIL_PROVIDER.toLowerCase();
  }
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'smtp';
}

/**
 * Startup self-test and verification logging.
 */
export function verifyEmailConfig() {
  const provider = getActiveEmailProvider();
  const from = env.email.from;

  if (provider === 'brevo') {
    if (!process.env.BREVO_API_KEY) {
      logger.warn('[EMAIL CONFIG] WARNING: Provider set to Brevo but BREVO_API_KEY is missing!');
    } else {
      logger.info(`[EMAIL CONFIG] OK | Provider: BREVO (HTTPS Port 443 API) | Sender: ${from}`);
    }
  } else if (provider === 'resend') {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('[EMAIL CONFIG] WARNING: Provider set to Resend but RESEND_API_KEY is missing!');
    } else {
      logger.info(`[EMAIL CONFIG] OK | Provider: RESEND (HTTPS Port 443 API) | Sender: ${from}`);
    }
  } else if (provider === 'smtp') {
    if (env.isProduction) {
      logger.warn(
        '[EMAIL CONFIG] CAUTION: Running SMTP in production on Render. Outbound ports 25/465/587 are blocked on Render free tier. Set BREVO_API_KEY to use HTTPS API port 443!'
      );
    } else {
      logger.info(`[EMAIL CONFIG] OK | Provider: Nodemailer SMTP | User: ${process.env.SMTP_USER || 'default'}`);
    }
  }
}

/**
 * Core provider-agnostic direct email sender.
 * Enforces 12-second abort timeout so network blocks never hang Express.
 */
export const sendEmail = sendEmailDirect;

export async function sendEmailDirect({ to, subject, html, text = '', type = 'transactional' }) {
  const provider = getActiveEmailProvider();
  const fromHeader = env.email.from;
  const { name: senderName, email: senderEmail } = parseSender(fromHeader);

  logger.info('email sending', { provider, recipient: to, subject, type });

  // 1. BREVO HTTPS API (Port 443 - Recommended for Render)
  if (provider === 'brevo') {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured in environment');
    }

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || undefined,
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Brevo API responded with status ${res.status}`;
      const err = new Error(errorMsg);
      err.code = data.code || `HTTP_${res.status}`;
      throw err;
    }

    const messageId = data.messageId || 'brevo-success';
    logger.info('email sent', { provider: 'brevo', recipient: to, messageId });
    return { success: true, provider: 'brevo', messageId };
  }

  // 2. RESEND HTTPS API (Port 443)
  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured in environment');
    }

    const payload = {
      from: fromHeader.includes('<') ? fromHeader : `${senderName} <${senderEmail}>`,
      to: [to],
      subject,
      html,
      text: text || undefined,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Resend API responded with status ${res.status}`;
      const err = new Error(errorMsg);
      err.code = data.name || `HTTP_${res.status}`;
      throw err;
    }

    const messageId = data.id || 'resend-success';
    logger.info('email sent', { provider: 'resend', recipient: to, messageId });
    return { success: true, provider: 'resend', messageId };
  }

  // 3. SMTP NODEMAILER FALLBACK (For Local Development)
  const transporter = getSmtpTransporter();
  if (!transporter) {
    throw new Error('No valid email provider configured (missing BREVO_API_KEY, RESEND_API_KEY, or SMTP credentials)');
  }

  const info = await transporter.sendMail({
    from: fromHeader,
    to,
    subject,
    html,
    text,
  });

  const messageId = info.messageId || info.response || 'smtp-ok';
  logger.info('email sent', { provider: 'smtp', recipient: to, messageId });
  return { success: true, provider: 'smtp', messageId };
}

/**
 * Reusable HTML Email Wrapper with Inline CSS styling.
 */
function wrapEmailTemplate({ title, content, footerText = 'Projectify - Modern Project Management Platform' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .wrapper { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 36px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
    .badge { background: #6366f1; color: #ffffff; font-weight: 800; font-size: 13px; padding: 6px 12px; border-radius: 6px; letter-spacing: 0.5px; display: inline-block; }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 18px; margin-bottom: 12px; }
    p { font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 12px 0; }
    .btn-container { margin: 26px 0; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .info-card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .info-card p { margin: 6px 0; font-size: 14px; color: #94a3b8; }
    .info-card strong { color: #f1f5f9; }
    .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #334155; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div><span class="badge">PROJECTIFY</span></div>
    <h1>${title}</h1>
    ${content}
    <div class="footer">
      <p>${footerText}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * In-Memory Email Queue with Exponential Backoff Retries.
 * Prevents dropping jobs and ensures non-blocking API operations.
 */
class EmailQueue {
  constructor() {
    this.queue = [];
    this.activeWorkers = 0;
    this.maxConcurrency = 2;
    this.maxRetries = 3;
  }

  enqueue(job) {
    try {
      const jobItem = {
        ...job,
        id: Math.random().toString(36).substring(7),
        attempts: 0,
        createdAt: new Date(),
      };
      this.queue.push(jobItem);
      logger.info('email queued', {
        jobType: job.type,
        recipient: job.to,
        queueLength: this.queue.length,
      });
      this.processNext();
    } catch (queueErr) {
      logger.warn('Queue enqueue failed, falling back to direct send', {
        recipient: job.to,
        error: queueErr.message,
      });
      sendEmailDirect(job).catch((directErr) => {
        logger.error('email failed (direct fallback)', {
          recipient: job.to,
          error: directErr.message,
        });
      });
    }
  }

  processNext() {
    if (this.activeWorkers >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.activeWorkers++;

    this.executeJob(job)
      .catch((err) => {
        job.attempts++;
        logger.error('email failed', {
          provider: getActiveEmailProvider(),
          recipient: job.to,
          jobType: job.type,
          attempt: job.attempts,
          errorCode: err.code || 'UNKNOWN_ERROR',
          errorMessage: err.message,
        });

        if (job.attempts < this.maxRetries) {
          const delay = Math.pow(3, job.attempts) * 1000;
          logger.info(`Scheduling email retry for ${job.to} in ${delay}ms (attempt ${job.attempts + 1}/${this.maxRetries})`);
          setTimeout(() => {
            this.queue.push(job);
            this.processNext();
          }, delay);
        } else {
          logger.error('Max retries reached. Dropping email job', {
            recipient: job.to,
            jobType: job.type,
          });
        }
      })
      .finally(() => {
        this.activeWorkers--;
        if (this.queue.length > 0) {
          setImmediate(() => this.processNext());
        }
      });
  }

  async executeJob(job) {
    await sendEmailDirect({
      to: job.to,
      subject: job.subject,
      html: job.html,
      text: job.text,
      type: job.type,
    });
  }
}

export const emailQueue = new EmailQueue();

// ---------------------------------------------------------------------------
// 1. Password Reset Email (Phase 1)
// ---------------------------------------------------------------------------
export function sendPasswordResetEmail({ to, resetUrl, userName = 'User' }) {
  const safeName = escapeHtml(userName);
  const safeResetUrl = escapeHtml(resetUrl);

  const content = `
    <p>Hi ${safeName},</p>
    <p>We received a request to reset your Projectify password. Click the button below to choose a new password. This link is valid for <strong>15 minutes</strong>.</p>
    <div class="btn-container">
      <a href="${safeResetUrl}" class="btn" target="_blank">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">Or copy and paste this link into your browser:<br/><a href="${safeResetUrl}" style="color: #818cf8; word-break: break-all;">${safeResetUrl}</a></p>
    <p>If you did not request this password reset, please ignore this email. Your account remains completely secure.</p>
  `;

  const text = `Hi ${userName},

We received a request to reset your Projectify password. This link is valid for 15 minutes.

Reset Password: ${resetUrl}

If you did not request this password reset, please ignore this email. Your account remains completely secure.`;

  const html = wrapEmailTemplate({
    title: 'Reset your Projectify password',
    content,
  });

  emailQueue.enqueue({
    type: 'password_reset',
    to,
    subject: 'Reset your Projectify password',
    html,
    text,
  });
}

// ---------------------------------------------------------------------------
// 2. Welcome Email on Signup (Phase 2)
// ---------------------------------------------------------------------------
export function sendWelcomeEmail({ to, userName = 'User' }) {
  const safeName = escapeHtml(userName);
  const clientUrl = env.frontendUrl || 'https://projectify-steel.vercel.app';

  const content = `
    <p>Hi ${safeName},</p>
    <p>Welcome to <strong>Projectify</strong>! We're thrilled to have you onboard.</p>
    <p>With Projectify, you can manage projects seamlessly, collaborate with teammates in real-time, organize tasks with sprints and epics, and boost your team's velocity.</p>
    <div class="info-card">
      <p><strong>Quick Tips to Get Started:</strong></p>
      <p>1. Create your first workspace to organize your team.</p>
      <p>2. Set up projects and invite colleagues by email.</p>
      <p>3. Plan your backlog and track sprints on dynamic Kanban boards.</p>
    </div>
    <div class="btn-container">
      <a href="${clientUrl}" class="btn" target="_blank">Go to My Dashboard</a>
    </div>
    <p>If you have any questions, feel free to reply directly to this email!</p>
  `;

  const text = `Hi ${userName},

Welcome to Projectify! We're thrilled to have you onboard.

Quick Tips to Get Started:
1. Create your first workspace to organize your team.
2. Set up projects and invite colleagues by email.
3. Plan your backlog and track sprints on dynamic Kanban boards.

Go to My Dashboard: ${clientUrl}

If you have any questions, feel free to reply directly to this email!`;

  const html = wrapEmailTemplate({
    title: "Welcome to Projectify! Let's build something great \u{1F680}",
    content,
  });

  emailQueue.enqueue({
    type: 'welcome',
    to,
    subject: "Welcome to Projectify! Let's build something great \u{1F680}",
    html,
    text,
  });
}

// ---------------------------------------------------------------------------
// 3. Workspace Invite Email (Phase 3)
// ---------------------------------------------------------------------------
export function sendWorkspaceInviteEmail({
  to,
  userName = 'Colleague',
  workspaceName = 'Workspace',
  inviterName = 'A teammate',
  role = 'member',
}) {
  const safeName = escapeHtml(userName);
  const safeWorkspace = escapeHtml(workspaceName);
  const safeInviter = escapeHtml(inviterName);
  const safeRole = escapeHtml(role.toUpperCase());
  const clientUrl = env.frontendUrl || 'https://projectify-steel.vercel.app';

  const content = `
    <p>Hi ${safeName},</p>
    <p><strong>${safeInviter}</strong> has invited you to join the <strong>${safeWorkspace}</strong> workspace as a <strong>${safeRole}</strong> on Projectify.</p>
    <div class="info-card">
      <p><strong>Workspace:</strong> ${safeWorkspace}</p>
      <p><strong>Assigned Role:</strong> ${safeRole}</p>
      <p><strong>Invited by:</strong> ${safeInviter}</p>
    </div>
    <p>Click below to jump right into the workspace and start collaborating with your team.</p>
    <div class="btn-container">
      <a href="${clientUrl}" class="btn" target="_blank">Open Workspace</a>
    </div>
  `;

  const text = `Hi ${userName},

${inviterName} has invited you to join the ${workspaceName} workspace as a ${role.toUpperCase()} on Projectify.

Workspace: ${workspaceName}
Assigned Role: ${role.toUpperCase()}
Invited by: ${inviterName}

Open Workspace: ${clientUrl}`;

  const html = wrapEmailTemplate({
    title: `You're invited to join ${safeWorkspace} on Projectify`,
    content,
  });

  emailQueue.enqueue({
    type: 'workspace_invite',
    to,
    subject: `You're invited to join ${workspaceName} on Projectify`,
    html,
    text,
  });
}

// ---------------------------------------------------------------------------
// 4. Task Assignment Email (Phase 4)
// ---------------------------------------------------------------------------
export function sendTaskAssignmentEmail({
  to,
  userName = 'Teammate',
  taskTitle = 'Untitled Task',
  projectName = 'Project',
  assignerName = 'A team member',
  priority = 'medium',
}) {
  const safeName = escapeHtml(userName);
  const safeTitle = escapeHtml(taskTitle);
  const safeProject = escapeHtml(projectName);
  const safeAssigner = escapeHtml(assignerName);
  const safePriority = escapeHtml(priority.toUpperCase());
  const clientUrl = env.frontendUrl || 'https://projectify-steel.vercel.app';

  const content = `
    <p>Hi ${safeName},</p>
    <p><strong>${safeAssigner}</strong> has assigned a task to you in <strong>${safeProject}</strong>.</p>
    <div class="info-card">
      <p><strong>Task:</strong> ${safeTitle}</p>
      <p><strong>Project:</strong> ${safeProject}</p>
      <p><strong>Priority:</strong> ${safePriority}</p>
      <p><strong>Assigned by:</strong> ${safeAssigner}</p>
    </div>
    <div class="btn-container">
      <a href="${clientUrl}" class="btn" target="_blank">View Task Details</a>
    </div>
  `;

  const text = `Hi ${userName},

${assignerName} has assigned a task to you in ${projectName}.

Task: ${taskTitle}
Project: ${projectName}
Priority: ${priority.toUpperCase()}
Assigned by: ${assignerName}

View Task Details: ${clientUrl}`;

  const html = wrapEmailTemplate({
    title: `Assigned: ${safeTitle} in ${safeProject}`,
    content,
  });

  emailQueue.enqueue({
    type: 'task_assigned',
    to,
    subject: `Assigned: ${taskTitle} in ${projectName}`,
    html,
    text,
  });
}
