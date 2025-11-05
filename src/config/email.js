const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

/**
 * Email transporter configuration
 * Supports Gmail, SMTP, and test accounts
 */
let transporter = null;

const createTransporter = async () => {
  try {
    // Check if we're in development and no SMTP credentials
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      // Create test account using Ethereal
      const testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      logger.info('📧 Using Ethereal test email account');
      logger.info(`📬 Preview emails at: https://ethereal.email`);
      logger.info(`   User: ${testAccount.user}`);
    } else if (process.env.SMTP_HOST) {
      // Production SMTP configuration
      transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      logger.info('📧 Email service configured with SMTP');
    } else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      // Gmail configuration (requires app password)
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS // Use App Password, not account password
        }
      });

      logger.info('📧 Email service configured with Gmail');
    } else {
      logger.warn('⚠️  No email configuration found. Email notifications will be disabled.');
      return null;
    }

    // Verify connection
    await transporter.verify();
    logger.info('✅ Email service verified and ready');

    return transporter;
  } catch (error) {
    logger.error('❌ Email service initialization failed:', error);
    return null;
  }
};

/**
 * Get email transporter (lazy initialization)
 */
const getTransporter = async () => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

/**
 * Email configuration
 */
const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Laundry Management System',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@laundry.com'
  },
  replyTo: process.env.EMAIL_REPLY_TO || 'support@laundry.com'
};

module.exports = {
  createTransporter,
  getTransporter,
  emailConfig
};
