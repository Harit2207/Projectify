import { sendEmailDirect, getActiveEmailProvider } from '../../core/services/email.service.js';
import { env } from '../../config/env.js';
import { ForbiddenError } from '../../core/errors/errorTypes.js';

export async function testEmail(req, res, next) {
  try {
    const secret = req.headers['x-debug-secret'];
    const isAuthorized = !env.isProduction || env.email.enableDebug || (secret && secret === env.email.debugSecret);

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
