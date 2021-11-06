import sgMail from '@sendgrid/mail';
import { config, logger } from '../config/';

const sendEmail = async (to: string, from: string, subject: string, text: string, html: string) => {
  // using Twilio SendGrid's v3 Node.js Library
  // https://github.com/sendgrid/sendgrid-nodejs

  sgMail.setApiKey(config.email.sendgridAPIKey);
  const msg = {
    to,
    from,
    subject,
    text,
    html,
  };
  sgMail.send(msg)
    .then(() => {
      logger.info(`📧 Email Sent to ${to}`);
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch((error: any) => {
      logger.warn(error);
    });
};


const sendResetPasswordEmail = async (to: string, newPassword: string) => {
  const subject = '🔐 Reset password';
  const text = `Dear user,
  Here your new password: ${newPassword}
  If you did not request any password resets, then please let us now.`;
  const html = `<p>Dear user,
  Here your new password: <b>${newPassword}</b>
  If you did not request any password resets, then please let us now.<p>`;
  await sendEmail(to, 'nodeApp', subject, text, html);
};


const sendVerificationEmail = async (to: string, token: string) => {
  const subject = 'Email Verification';
  // TODO: -- replace this url with the link to the email verification service back-end app
  const verificationEmailUrl = `${config.host}:${config.port}/api/auth/verify-email/${token}`;
  const text = `Dear user,
  To verify your email, click on this link: ${verificationEmailUrl}
  If you did not create an account, then ignore this email.`;
  const html = `<p>Dear user,
  To verify your email, click <a href="${verificationEmailUrl}">Here</a> <br>
  If you did not create an account, then ignore this email.`;
  await sendEmail(to, 'nodeApp', subject, text, html);
};

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
