import nodemailer from "nodemailer";

// Professional email configuration with anti-spam measures
export const transporter = nodemailer.createTransport({
  host: "https://24sevenfairmart.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_AUTH_EMAIL,
    pass: process.env.USER_AUTH_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 14, // Limit to 14 emails per second
  requireTLS: true,
  tls: {
    rejectUnauthorized: false // Helpful for testing in development
  },
  logger: true, // Enable logging for debugging
  debug: true, // Show detailed SMTP logs
  // Anti-spam headers
  headers: {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High',
    'Importance': 'high',
    'X-Mailer': '24SevenFairMart Mailer'
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.red);
  } else {
    console.log('✉️ Email server is ready to send messages'.green);
  }
});