import { sendEmailDirect, getActiveEmailProvider } from '../../core/services/email.service.js';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { ForbiddenError } from '../../core/errors/errorTypes.js';

export async function testEmail(req, res, next) {
  try {
    const secret = req.headers['x-debug-secret'];
    const expected = env.email.debugSecret;
    const secretOk =
      Boolean(expected) &&
      typeof secret === 'string' &&
      secret.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
    // In production the endpoint needs BOTH the enable flag and the secret header.
    const isAuthorized = env.isProduction ? env.email.enableDebug && secretOk : true;

    if (!isAuthorized) {
      throw new ForbiddenError('Unauthorized: Diagnostic test endpoint is protected');
    }

    const { to } = req.body;
    const provider = getActiveEmailProvider();

    const result = await sendEmailDirect({
      to,
      subject: 'Projectify Production Diagnostic Test Email',
      html: `
        <h2>Projectify Diagnostic Email</h2>
        <p>This is a live test email confirming that Projectify transactional emails are functioning properly in production.</p>
        <p><strong>Active Provider:</strong> ${provider.toUpperCase()}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
      text: `Projectify Diagnostic Email\nActive Provider: ${provider}\nTimestamp: ${new Date().toISOString()}`,
      type: 'diagnostic',
    });

    res.json({
      success: true,
      message: 'Test email delivered successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
