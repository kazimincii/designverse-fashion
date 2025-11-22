import nodemailer from 'nodemailer';

// Check if SMTP is configured
const isSmtpConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

// Create transporter only if SMTP is configured
const createTransporter = () => {
  if (!isSmtpConfigured()) {
    console.warn('SMTP not configured. Email notifications will be logged only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@nim.com';

export const emailService = {
  // Send welcome email
  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    const subject = 'Welcome to Nim!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to Nim, ${displayName}!</h1>
        <p>We're excited to have you on board. Start creating amazing AI-powered videos today!</p>
        <p>You've been given <strong>100 free credits</strong> to get started.</p>
        <a href="${process.env.FRONTEND_URL}/workspace" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          Start Creating
        </a>
      </div>
    `;

    if (!transporter) {
      console.log('[EMAIL] Would send welcome email:', { to, subject });
      return;
    }

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log('[EMAIL] Welcome email sent successfully to:', to);
    } catch (error) {
      console.error('[EMAIL] Error sending welcome email:', error);
    }
  },

  // Send video export ready email
  async sendVideoReadyEmail(to: string, storyTitle: string, storyUrl: string): Promise<void> {
    const subject = `Your video "${storyTitle}" is ready!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your video is ready!</h2>
        <p>Your story "<strong>${storyTitle}</strong>" has been generated successfully.</p>
        <a href="${storyUrl}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          View Your Video
        </a>
      </div>
    `;

    if (!transporter) {
      console.log('[EMAIL] Would send video ready email:', { to, subject, storyUrl });
      return;
    }

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log('[EMAIL] Video ready email sent successfully to:', to);
    } catch (error) {
      console.error('[EMAIL] Error sending video ready email:', error);
    }
  },

  // Send low credits warning
  async sendLowCreditsEmail(to: string, creditsRemaining: number): Promise<void> {
    const subject = 'Low credits warning';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're running low on credits!</h2>
        <p>You have <strong>${creditsRemaining} credits</strong> remaining.</p>
        <p>Upgrade your plan to get more credits and continue creating amazing videos.</p>
        <a href="${process.env.FRONTEND_URL}/pricing" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          View Plans
        </a>
      </div>
    `;

    if (!transporter) {
      console.log('[EMAIL] Would send low credits email:', { to, subject, creditsRemaining });
      return;
    }

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log('[EMAIL] Low credits email sent successfully to:', to);
    } catch (error) {
      console.error('[EMAIL] Error sending low credits email:', error);
    }
  },

  // Send photo session ready email
  async sendPhotoSessionReadyEmail(to: string, sessionTitle: string, sessionUrl: string): Promise<void> {
    const subject = `Your photo session "${sessionTitle}" is ready!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your photo session is ready!</h2>
        <p>Your premium photo session "<strong>${sessionTitle}</strong>" has been processed successfully.</p>
        <p>View your enhanced photos, variations, and animations now!</p>
        <a href="${sessionUrl}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          View Your Photos
        </a>
      </div>
    `;

    if (!transporter) {
      console.log('[EMAIL] Would send photo session ready email:', { to, subject, sessionUrl });
      return;
    }

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log('[EMAIL] Photo session ready email sent successfully to:', to);
    } catch (error) {
      console.error('[EMAIL] Error sending photo session ready email:', error);
    }
  },

  // Check if email service is available
  isAvailable(): boolean {
    return isSmtpConfigured();
  },
};
