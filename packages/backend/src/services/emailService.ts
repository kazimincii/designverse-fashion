import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@nim.com';

export const emailService = {
  // Send welcome email
  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject: 'Welcome to Nim!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6366f1;">Welcome to Nim, ${displayName}!</h1>
            <p>We're excited to have you on board. Start creating amazing AI-powered videos today!</p>
            <p>You've been given <strong>100 free credits</strong> to get started.</p>
            <a href="${process.env.FRONTEND_URL}/workspace" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
              Start Creating
            </a>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  },

  // Send video export ready email
  async sendVideoReadyEmail(to: string, storyTitle: string, storyUrl: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject: `Your video "${storyTitle}" is ready!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your video is ready!</h2>
            <p>Your story "<strong>${storyTitle}</strong>" has been generated successfully.</p>
            <a href="${storyUrl}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
              View Your Video
            </a>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending video ready email:', error);
    }
  },

  // Send low credits warning
  async sendLowCreditsEmail(to: string, creditsRemaining: number): Promise<void> {
    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject: 'Low credits warning',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You're running low on credits!</h2>
            <p>You have <strong>${creditsRemaining} credits</strong> remaining.</p>
            <p>Upgrade your plan to get more credits and continue creating amazing videos.</p>
            <a href="${process.env.FRONTEND_URL}/pricing" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
              View Plans
            </a>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending low credits email:', error);
    }
  },
};
