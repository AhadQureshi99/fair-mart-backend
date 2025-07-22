import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_AUTH_EMAIL,
    pass: process.env.USER_AUTH_PASS,
  },
  pool: true,
  maxConnections: 5,
  tls: {
    rejectUnauthorized: false, // For VPS environments
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});
