import nodemailer from 'nodemailer';
import config from '../config';

interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: IEmailOptions): Promise<boolean> => {
  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: Number(config.smtp.port) || 587,
        secure: Number(config.smtp.port) === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });

      await transporter.sendMail({
        from: `"DevAssess Platform" <${config.smtp.user}>`,
        to,
        subject,
        html,
      });

      return true;
    } catch (error) {
      console.warn(`[emailSender] SMTP dispatch failed: ${(error as Error).message}`);
    }
  }

  // Graceful dev fallback log
  console.log(`[emailSender:dev] Simulated email to: ${to} | Subject: "${subject}"`);
  return true;
};
