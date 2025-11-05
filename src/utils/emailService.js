const { getTransporter, emailConfig } = require('../config/email');
const { logger } = require('./logger');

/**
 * Send email with HTML template
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await getTransporter();

    if (!transporter) {
      logger.warn('Email transporter not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
      to,
      subject,
      text,
      html,
      replyTo: emailConfig.replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`📧 Email sent to ${to}: ${subject}`);

    // Log preview URL for test accounts (Ethereal)
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      logger.info(`📬 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    logger.error('❌ Email send failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmation = async (order, customer) => {
  const subject = `Order Confirmation - ${order.orderNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .status { display: inline-block; padding: 5px 15px; background: #FFC107; color: #333; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧺 Order Confirmation</h1>
        </div>

        <div class="content">
          <p>Dear <strong>${customer.name}</strong>,</p>

          <p>Thank you for your order! We've received your laundry and will take good care of it.</p>

          <div class="order-info">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Status:</strong> <span class="status">${order.status.toUpperCase()}</span></p>
            <p><strong>Total Amount:</strong> ฿${order.totalAmount}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            ${order.pickupDate ? `<p><strong>Estimated Pickup:</strong> ${new Date(order.pickupDate).toLocaleDateString('th-TH')}</p>` : ''}
          </div>

          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.service?.name || 'Service'}</td>
                  <td>${item.quantity}</td>
                  <td>฿${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}

          <p>You can track your order status by logging into your account.</p>
        </div>

        <div class="footer">
          <p>This is an automated message from Laundry Management System.</p>
          <p>If you have any questions, please contact us at ${emailConfig.replyTo}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Confirmation - ${order.orderNumber}

Dear ${customer.name},

Thank you for your order! We've received your laundry.

Order Number: ${order.orderNumber}
Status: ${order.status}
Total Amount: ฿${order.totalAmount}
Payment Status: ${order.paymentStatus}

You can track your order status by logging into your account.
  `;

  return sendEmail({
    to: customer.email,
    subject,
    html,
    text
  });
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdate = async (order, customer, oldStatus, newStatus) => {
  const subject = `Order Status Updated - ${order.orderNumber}`;

  const statusMessages = {
    pending: 'Your order is waiting to be processed.',
    processing: 'We are currently working on your laundry!',
    ready: 'Your laundry is ready for pickup!',
    completed: 'Your order has been completed. Thank you!',
    cancelled: 'Your order has been cancelled.'
  };

  const statusColors = {
    pending: '#FFC107',
    processing: '#2196F3',
    ready: '#4CAF50',
    completed: '#4CAF50',
    cancelled: '#F44336'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColors[newStatus]}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status-update { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
        .status { font-size: 24px; font-weight: bold; color: ${statusColors[newStatus]}; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Order Status Update</h1>
        </div>

        <div class="content">
          <p>Dear <strong>${customer.name}</strong>,</p>

          <p>Your order <strong>${order.orderNumber}</strong> status has been updated!</p>

          <div class="status-update">
            <p>Status changed from:</p>
            <p style="color: #999; text-decoration: line-through;">${oldStatus.toUpperCase()}</p>
            <p>↓</p>
            <p class="status">${newStatus.toUpperCase()}</p>
            <p style="margin-top: 15px;">${statusMessages[newStatus]}</p>
          </div>

          ${newStatus === 'ready' ? `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 0;"><strong>🎉 Great news!</strong> Your laundry is ready for pickup.</p>
              ${order.pickupDate ? `<p style="margin: 5px 0 0 0;">Please collect it by ${new Date(order.pickupDate).toLocaleDateString('th-TH')}</p>` : ''}
            </div>
          ` : ''}

          <p><strong>Order Summary:</strong></p>
          <p>Total Amount: ฿${order.totalAmount}</p>
          <p>Payment Status: ${order.paymentStatus}</p>
        </div>

        <div class="footer">
          <p>Track your order anytime by logging into your account.</p>
          <p>This is an automated message from Laundry Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Status Update - ${order.orderNumber}

Dear ${customer.name},

Your order ${order.orderNumber} status has been updated!

Previous Status: ${oldStatus}
New Status: ${newStatus}

${statusMessages[newStatus]}

Order Summary:
Total Amount: ฿${order.totalAmount}
Payment Status: ${order.paymentStatus}

Track your order anytime by logging into your account.
  `;

  return sendEmail({
    to: customer.email,
    subject,
    html,
    text
  });
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Laundry Management System!';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 30px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .features { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; }
        .features li { margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Laundry Management!</h1>
        </div>

        <div class="content">
          <p>Hello <strong>${user.name}</strong>,</p>

          <p>Thank you for registering with our Laundry Management System! We're excited to have you on board.</p>

          <div class="features">
            <h3>What you can do:</h3>
            <ul>
              <li>📦 Create and track your laundry orders</li>
              <li>🔔 Get real-time notifications on order status</li>
              <li>📊 View your order history and analytics</li>
              <li>💳 Manage your account and preferences</li>
            </ul>
          </div>

          <p>Your account details:</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>

          <p style="text-align: center;">
            <a href="#" class="button">Get Started</a>
          </p>

          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>

        <div class="footer">
          <p>This is an automated welcome message from Laundry Management System.</p>
          <p>Questions? Contact us at ${emailConfig.replyTo}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Laundry Management System!

Hello ${user.name},

Thank you for registering! We're excited to have you on board.

Your account details:
Email: ${user.email}
Role: ${user.role}

What you can do:
- Create and track your laundry orders
- Get real-time notifications
- View order history
- Manage your account

If you have any questions, contact us at ${emailConfig.replyTo}
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

// Required for preview URLs in test mode
const nodemailer = require('nodemailer');

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendWelcomeEmail
};
