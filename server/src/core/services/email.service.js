import { env } from '../../config/env.js';
import nodemailer from 'nodemailer';
import { logger } from '../logger/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'haritgevariya007@gmail.com';
  const pass = (process.env.SMTP_PASS || 'pxsf bgts ofdd dkbj').trim();

  if (user && pass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    logger.info('Nodemailer Gmail transporter initialized for ' + user);
  } else {
    logger.warn('Nodemailer transporter credentials missing');
  }

  return transporter;
}

// Reusable email container styling with standard UTF-8 text
function wrapEmailTemplate({ title, content, footerText = 'Projectify — Modern Project Management Platform' }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { display: flex; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
        .logo-badge { background: #6366f1; color: #ffffff; font-weight: 800; font-size: 14px; padding: 6px 12px; border-radius: 6px; letter-spacing: 0.5px; display: inline-block; }
        h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 16px; margin-bottom: 12px; }
        p { font-size: 15px; color: #475569; line-height: 1.6; margin: 12px 0; }
        .btn-container { margin: 28px 0; text-align: left; }
        .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.25); }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .info-card p { margin: 6px 0; font-size: 14px; }
        .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo-badge">PROJECTIFY</span>
        </div>
        <h1>${title}</h1>
        ${content}
        <div class="footer">
          <p>${footerText}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// In-Memory Queue with Automatic Retries & Non-blocking Dispatch
class EmailQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.concurrency = 1;
  }

  enqueue(job) {
    this.queue.push({
      ...job,
      id: Math.random().toString(36).substring(7),
      attempts: 0,
      createdAt: new Date(),
    });
    logger.info('Email job enqueued to background worker', {
      jobType: job.type,
      recipient: job.to,
      queueLength: this.queue.length,
    });
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    try {
      await this.executeJob(job);
    } catch (err) {
      job.attempts += 1;
      logger.error('Email delivery error in background worker', {
        jobType: job.type,
        recipient: job.to,
        attempt: job.attempts,
        error: err.message,
      });

      if (job.attempts < this.maxRetries) {
        const delay = job.attempts * 3000;
        logger.info(`Scheduling retry for ${job.to} in ${delay}ms`);
        setTimeout(() => {
          this.queue.push(job);
          this.processNext();
        }, delay);
      } else {
        logger.error(`Max retries reached. Dropping email job for ${job.to}`);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  async executeJob(job) {
    const mailTransporter = getTransporter();

    if (!mailTransporter) {
      logger.warn('SMTP transporter is null, email cannot be sent to: ' + job.to);
      return;
    }

    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM || `"Projectify" <${process.env.SMTP_USER || 'haritgevariya007@gmail.com'}>`,
      to: job.to,
      subject: job.subject,
      html: job.html,
    });

    logger.info('Email delivered successfully by background worker', {
      jobType: job.type,
      to: job.to,
    });
  }
}

export const emailQueue = new EmailQueue();

// ---------------------------------------------------------------------------
// 1. Password Reset Email (Phase 1)
// ---------------------------------------------------------------------------
export function sendPasswordResetEmail({ to, resetUrl, userName = 'User' }) {
  const content = `
    <p>Hi ${userName},</p>
    <p>We received a request to reset your Projectify password. Click the button below to choose a new password. This link is valid for <strong>15 minutes</strong>.</p>
    <div class="btn-container">
      <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">Or paste this link into your browser: <br/><a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a></p>
    <p>If you did not request this password reset, please ignore this email. Your account remains completely secure.</p>
  `;

  const html = wrapEmailTemplate({
    title: 'Password Reset Request',
    content,
  });

  emailQueue.enqueue({
    type: 'password_reset',
    to,
    subject: 'Reset your Projectify password',
    html,
  });
}

// ---------------------------------------------------------------------------
// 2. Welcome Email on Signup (Phase 2)
// ---------------------------------------------------------------------------
export function sendWelcomeEmail({ to, userName = 'User' }) {
  const clientUrl = env.clientUrl || (env.isProduction ? 'https://projectify-steel.vercel.app' : 'http://localhost:5173');
  const content = `
    <p>Hi ${userName},</p>
    <p>Welcome to <strong>Projectify</strong>! We are thrilled to have you onboard.</p>
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

  const html = wrapEmailTemplate({
    title: 'Welcome to Projectify!',
    content,
  });

  emailQueue.enqueue({
    type: 'welcome',
    to,
    subject: 'Welcome to Projectify! Let us build something great',
    html,
  });
}

// ---------------------------------------------------------------------------
// 3. Workspace Invite Email (Phase 3)
// ---------------------------------------------------------------------------
export function sendWorkspaceInviteEmail({
  to,
  userName = 'Colleague',
  workspaceName,
  inviterName = 'A teammate',
  role = 'member',
}) {
  const clientUrl = env.clientUrl || (env.isProduction ? 'https://projectify-steel.vercel.app' : 'http://localhost:5173');
  const content = `
    <p>Hi ${userName},</p>
    <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace as a <strong>${role}</strong> on Projectify.</p>
    <div class="info-card">
      <p><strong>Workspace:</strong> ${workspaceName}</p>
      <p><strong>Assigned Role:</strong> ${role.toUpperCase()}</p>
      <p><strong>Invited by:</strong> ${inviterName}</p>
    </div>
    <p>Click below to jump right into the workspace and start collaborating with your team.</p>
    <div class="btn-container">
      <a href="${clientUrl}" class="btn" target="_blank">Open Workspace</a>
    </div>
  `;

  const html = wrapEmailTemplate({
    title: `You have been invited to ${workspaceName}`,
    content,
  });

  emailQueue.enqueue({
    type: 'workspace_invite',
    to,
    subject: `You are invited to join ${workspaceName} on Projectify`,
    html,
  });
}

// ---------------------------------------------------------------------------
// 4. Task Assignment Email (Phase 4)
// ---------------------------------------------------------------------------
export function sendTaskAssignmentEmail({
  to,
  userName = 'Teammate',
  taskTitle,
  projectName = 'Project',
  assignerName = 'A team member',
  priority = 'medium',
}) {
  const clientUrl = env.clientUrl || (env.isProduction ? 'https://projectify-steel.vercel.app' : 'http://localhost:5173');
  const content = `
    <p>Hi ${userName},</p>
    <p><strong>${assignerName}</strong> has assigned a task to you in <strong>${projectName}</strong>.</p>
    <div class="info-card">
      <p><strong>Task:</strong> ${taskTitle}</p>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
      <p><strong>Assigned by:</strong> ${assignerName}</p>
    </div>
    <div class="btn-container">
      <a href="${clientUrl}" class="btn" target="_blank">View Task Details</a>
    </div>
  `;

  const html = wrapEmailTemplate({
    title: 'New Task Assigned to You',
    content,
  });

  emailQueue.enqueue({
    type: 'task_assigned',
    to,
    subject: `Assigned: ${taskTitle} in ${projectName}`,
    html,
  });
}
