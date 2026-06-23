import { Resend } from 'resend';
import { logger } from '../middleware/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@ielts-checker.com';

export async function sendEvaluationCompleteEmail(params: {
  to: string;
  full_name: string | null;
  overall_band: number;
  submission_id: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your IELTS evaluation is ready — Band ${params.overall_band}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #16324e; color: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="font-family: Georgia, serif; font-size: 72px; margin: 0;">${params.overall_band}</h1>
            <p style="color: #9fb4c9; font-size: 14px; letter-spacing: 4px; margin: 0;">ESTIMATED BAND</p>
          </div>
          <div style="padding: 24px 0;">
            <p>Hi ${params.full_name ?? 'there'},</p>
            <p>Your IELTS essay evaluation is complete. Your estimated band score is <strong>${params.overall_band}</strong>.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard/results/${params.submission_id}"
               style="display: inline-block; background: #16324e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
              View Full Report
            </a>
            <p style="color: #666; font-size: 13px;">Keep practicing — every essay gets you closer to your target band!</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    logger.error('Failed to send evaluation email', { error: err, to: params.to });
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  full_name: string | null;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'Welcome to BandWise IELTS Checker',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #16324e; padding: 24px; border-radius: 12px; text-align: center;">
            <h2 style="color: white; font-family: Georgia, serif;">BandWise</h2>
            <p style="color: #9fb4c9;">AI-Powered IELTS Writing Checker</p>
          </div>
          <div style="padding: 24px 0;">
            <p>Hi ${params.full_name ?? 'there'},</p>
            <p>Welcome! You have <strong>3 free essay checks</strong> to get started.</p>
            <p>Submit your first essay and get detailed feedback with band scores across all 4 criteria.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard/check"
               style="display: inline-block; background: #16324e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Check Your First Essay
            </a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    logger.error('Failed to send welcome email', { error: err, to: params.to });
  }
}

export async function sendCreditRefundEmail(params: {
  to: string;
  full_name: string | null;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: 'Your essay credit has been refunded',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hi ${params.full_name ?? 'there'},</p>
          <p>We encountered an issue processing your IELTS essay evaluation. Your credit has been refunded.</p>
          <p>Please try submitting your essay again. If the problem persists, contact our support team.</p>
          <a href="${process.env.FRONTEND_URL}/dashboard/check"
             style="display: inline-block; background: #16324e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Try Again
          </a>
        </div>
      `,
    });
  } catch (err) {
    logger.error('Failed to send refund email', { error: err, to: params.to });
  }
}
